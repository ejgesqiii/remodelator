Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Estimate2
        Inherits PageBase

        Dim _OrderManager As New OrderManager()
        Dim _BaseClassManager As New BaseClassManager()

#Region "Public Properties"

        Public Property ControlMode() As PageMode
            Get
                Dim o As Object = ViewState("ControlMode")
                If IsNothing(o) Then
                    Return PageMode.Add
                Else
                    Return CType(o, PageMode)
                End If
            End Get
            Set(ByVal value As PageMode)
                ViewState("ControlMode") = value
            End Set
        End Property

        Public Property OrderID() As Integer
            Get
                Dim o As Object = ViewState("OrderID")
                If IsNothing(o) Then
                    Return 0
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("OrderID") = value
            End Set
        End Property
#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If

            ItemGroupMessage.Visible = False
            ErrorPanel.Visible = False

            If Not Page.IsPostBack Then
                DataBindStates()
                DataBindCountries()
                country.SelectedIndex = 1

                Dim QueryVal As String = Request.QueryString("ID")
                If QueryVal <> "" Then
                    ControlMode = PageMode.Edit
                    OrderID = CInt(QueryVal)
                    LoadData(OrderID)
                    DataBindOrderItemGroups()
                    ItemGroupsPanel.Visible = True
                Else
                    lblTitle.Text = "Create New Estimate"
                    'Set Billing Rates and Markups to the subscriber defaults
                    SetSubscriberDefaults()
                    Estimate = Nothing
                    ItemGroupsPanel.Visible = False
                End If
            End If
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            Master.ColumnCount = 1

            SetVisibility()

            If Not Page.IsPostBack Then
                JobBanner.InnerHtml = Utilities.GetEstimateBanner(Estimate, True)
                JobBanner.Visible = (JobBanner.InnerHtml <> "")
            End If

        End Sub

#End Region

#Region "Control Events"


        Protected Sub GroupsGrid_ItemDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.DataGridItemEventArgs) Handles GroupsGrid.ItemDataBound
            If e.Item.ItemType = ListItemType.Item Or e.Item.ItemType = ListItemType.AlternatingItem Then
                Dim btnDel As LinkButton = CType(e.Item.Cells(1).Controls(0), LinkButton)
                btnDel.Attributes.Add("onclick", "return confirm('Are you sure you want to delete this item group? If you continue, estimate items currently in this group will no longer be associated with a named group..');")
            End If
        End Sub

        Protected Sub GroupsGrid_CancelCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.DataGridCommandEventArgs) Handles GroupsGrid.CancelCommand
            GroupsGrid.EditItemIndex = -1
            DataBindOrderItemGroups()
            AddGroupPanel.Style.Remove("visibility")
        End Sub

        Protected Sub GroupsGrid_DeleteCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.DataGridCommandEventArgs) Handles GroupsGrid.DeleteCommand
            _OrderManager.OrderItemGroupDelete(CInt(GroupsGrid.DataKeys(e.Item.ItemIndex)))
            DataBindOrderItemGroups()
            ItemGroupMessage.Visible = True
            ItemGroupMessage.Style("color") = "green"
            ItemGroupMessage.InnerHtml = "The item group has been deleted."
        End Sub

        Protected Sub GroupsGrid_EditCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.DataGridCommandEventArgs) Handles GroupsGrid.EditCommand
            GroupsGrid.EditItemIndex = e.Item.ItemIndex
            DataBindOrderItemGroups()
            GroupsGrid.Columns(1).Visible = False
            AddGroupPanel.Style("visibility") = "hidden"
        End Sub

        Protected Sub GroupsGrid_UpdateCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.DataGridCommandEventArgs) Handles GroupsGrid.UpdateCommand
            Dim Name As String = CType(e.Item.Cells(2).Controls(0), TextBox).Text
            Dim GroupID As Integer = CInt(GroupsGrid.DataKeys(e.Item.ItemIndex))
            If Name = "" Then
                ItemGroupMessage.Visible = True
                ItemGroupMessage.Style("color") = "red"
                ItemGroupMessage.InnerHtml = "Please specify a name for the new item group."
                Exit Sub
            ElseIf Name.ToLower() = "base bid" Then
                'verify name isn't duplicate
                ItemGroupMessage.Visible = True
                ItemGroupMessage.Style("color") = "red"
                ItemGroupMessage.InnerHtml = "There is already an item group with the same name."
                Exit Sub
            End If
            Dim OrderItemGroup As OrderItemGroupEntity = _OrderManager.OrderItemGroupSelect(Name)
            If Not IsNothing(OrderItemGroup) AndAlso OrderItemGroup.GroupId <> GroupID Then
                'verify name isn't duplicate
                ItemGroupMessage.Visible = True
                ItemGroupMessage.Style("color") = "red"
                ItemGroupMessage.InnerHtml = "There is already an item group with the same name."
                Exit Sub
            End If

            If IsNothing(OrderItemGroup) Then
                OrderItemGroup = _OrderManager.OrderItemGroupSelect(GroupID)
                OrderItemGroup.Name = Name
                _OrderManager.OrderItemGroupUpdate(OrderItemGroup)
            End If
            'save the change
            GroupsGrid.EditItemIndex = -1
            DataBindOrderItemGroups()
            AddGroupPanel.Style.Remove("visibility")
        End Sub

        Protected Sub btnAddGroup_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnAddGroup.Click
            'verify name isn't blank
            If GroupName.Text = "" Then
                ItemGroupMessage.Visible = True
                ItemGroupMessage.Style("color") = "red"
                ItemGroupMessage.InnerHtml = "Please specify a name for the new item group."
                Exit Sub
            ElseIf GroupName.Text.ToLower() = "base bid" Or Not IsNothing(_OrderManager.OrderItemGroupSelect(GroupName.Text)) Then
                'verify name isn't duplicate
                ItemGroupMessage.Visible = True
                ItemGroupMessage.Style("color") = "red"
                ItemGroupMessage.InnerHtml = "There is already an item group with the same name."
                Exit Sub
            End If

            _OrderManager.OrderItemGroupInsert(Estimate.OrderId, GroupName.Text)
            DataBindOrderItemGroups()
            GroupName.Text = ""
            ItemGroupMessage.Visible = True
            ItemGroupMessage.Style("color") = "green"
            ItemGroupMessage.InnerHtml = "The item group has been created."
        End Sub

        Protected Sub btnCancel_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnCancel.Click
            Response.Redirect("SubscriberHome.aspx", True)
        End Sub

        Protected Sub btnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSave.Click, btnCreate.Click

            If Not ValidateFields() Then
                Return
            End If

            'If adding, then create new, else save existing
            If ControlMode = PageMode.Add Then
                Estimate = New OrderEntity
                Estimate.Locked = False
            Else
                Estimate = _OrderManager.OrderSelect(OrderID)
            End If

            Estimate.Description = proposalName.Text

            Estimate.BillFirstName = firstName.Text
            Estimate.BillLastName = lastName.Text
            Estimate.BillAddr1 = address1.Text
            Estimate.BillAddr2 = address2.Text
            Estimate.BillCity = city.Text
            Estimate.BillState = state.Text
            Estimate.BillCountry = country.Text
            Estimate.BillZip = zipcode.Text

            Estimate.BillEmail = email.Text
            Estimate.BillPhone = phone.Text
            Estimate.BillPhoneEve = phoneEve.Text
            Estimate.BillFax = fax.Text
            Estimate.Revision = 1
            Estimate.SubscriberId = Subscriber.SubscriberId
            Estimate.PayMethodId = 1    'Credit Card
            Estimate.DateUpdated = Now()

            Dim NewRemodelerRate As Decimal = -1
            Dim NewPlumberRate As Decimal = -1
            Dim NewTinnerRate As Decimal = -1
            Dim NewElectricianRate As Decimal = -1
            Dim NewDesignerRate As Decimal = -1
            Dim NewMaterialRate As Decimal = -1
            Dim NewLaborRate As Decimal = -1
            Dim NewSubRate As Decimal = -1

            Estimate.RemodelerBillRate = CDec(RemodelerRate.Text)
            Estimate.PlumberBillRate = CDec(PlumberRate.Text)
            Estimate.TinnerBillRate = CDec(TinnerRate.Text)
            Estimate.ElectricianBillRate = CDec(ElectricianRate.Text)
            Estimate.DesignerBillRate = CDec(DesignerRate.Text)
            If Estimate.MaterialMarkup <> CDec(MaterialMarkup.Text) Then
                'rate changed - apply changes to all currently open estimates
                Estimate.MaterialMarkup = CDec(MaterialMarkup.Text)
                NewMaterialRate = Estimate.MaterialMarkup
            End If
            If Estimate.LaborMarkup <> CDec(LaborMarkup.Text) Then
                'rate changed - apply changes to all currently open estimates
                Estimate.LaborMarkup = CDec(LaborMarkup.Text)
                NewLaborRate = Estimate.LaborMarkup
            End If
            If Estimate.SubMarkup <> CDec(SubMarkup.Text) Then
                'rate changed - apply changes to all currently open estimates
                Estimate.SubMarkup = CDec(SubMarkup.Text)
                NewSubRate = Estimate.SubMarkup
            End If

            If Estimate.IsNew Then
                Estimate = _OrderManager.OrderInsert(Estimate)
            Else
                'apply any changes to global rates across all items in the estimate
                _OrderManager.OrderItemRateUpdate(Estimate, NewMaterialRate, NewLaborRate, NewSubRate)
                Estimate.OrderTotal = _OrderManager.CalculateOrderTotal(Estimate.OrderId)
                _OrderManager.OrderUpdate(Estimate)
            End If

            If ControlMode = PageMode.Add Then
                Response.Redirect("ProductHome.aspx", True)
            Else
                Response.Redirect("SubscriberHome.aspx", True)
            End If

        End Sub

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Function ValidateFields() As Boolean
            Dim Errors As New StringBuilder()

            If proposalName.Text = "" Then
                Errors.Append("Proposal Name not specified.").Append("<BR/>")
            End If
            If firstName.Text = "" Then
                Errors.Append("First Name not specified.").Append("<BR/>")
            End If
            If lastName.Text = "" Then
                Errors.Append("Last Name not specified.").Append("<BR/>")
            End If
            If address1.Text = "" Then
                Errors.Append("Address1 not specified.").Append("<BR/>")
            End If
            If city.Text = "" Then
                Errors.Append("City not specified.").Append("<BR/>")
            End If
            If state.SelectedIndex = 0 Then
                Errors.Append("State not specified.").Append("<BR/>")
            End If
            If country.SelectedIndex = 0 Then
                Errors.Append("Country not specified.").Append("<BR/>")
            End If
            If zipcode.Text = "" Then
                Errors.Append("ZipCode not specified.").Append("<BR/>")
            ElseIf Not Utilities.IsValidZipCode(zipcode.Text, country.SelectedIndex = 0) Then
                Errors.Append("ZipCode is not valid.").Append("<BR/>")
            End If
            If phone.Text = "" Then
                Errors.Append("Phone not specified.").Append("<BR/>")
            ElseIf Not IsValidPhone(phone.Text) Then
                Errors.Append("Phone number is not valid.").Append("<BR/>")
            End If
            If phoneEve.Text <> "" Then
                If Not IsValidPhone(phoneEve.Text) Then
                    Errors.Append("Evening phone number is not valid.").Append("<BR/>")
                End If
            End If
            If fax.Text <> "" Then
                If Not IsValidPhone(fax.Text) Then
                    Errors.Append("Fax number is not valid.").Append("<BR/>")
                End If
            End If
            If email.Text <> "" Then
                'Email address isn't required, but if specified, it must be valid!
                If Not IsValidEmailAddr(email.Text) Then
                    Errors.Append("Invalid Email Address.").Append("<BR/>")
                End If
            End If

            If Not IsValidRateInput(RemodelerRate.Text) Then
                Errors.Append("Remodeler Billing Rate must a value greater than 0.").Append("<BR/>")
            End If
            If Not IsValidRateInput(PlumberRate.Text) Then
                Errors.Append("Plumber Billing Rate must a value greater than 0.").Append("<BR/>")
            End If
            If Not IsValidRateInput(TinnerRate.Text) Then
                Errors.Append("Tinner Billing Rate must a value greater than 0.").Append("<BR/>")
            End If
            If Not IsValidRateInput(ElectricianRate.Text) Then
                Errors.Append("Electrician Billing Rate must a value greater than 0.").Append("<BR/>")
            End If
            If Not IsValidRateInput(DesignerRate.Text) Then
                Errors.Append("Designer Billing Rate must a value greater than 0.").Append("<BR/>")
            End If

            If Not IsValidMarkupInput(MaterialMarkup.Text) Then
                Errors.Append("Material Markup must a value greater than 0.").Append("<BR/>")
            End If
            If Not IsValidMarkupInput(LaborMarkup.Text) Then
                Errors.Append("Labor Markup must a value greater than 0.").Append("<BR/>")
            End If
            If Not IsValidMarkupInput(SubMarkup.Text) Then
                Errors.Append("Subcontractor Markup must a value greater than 0.").Append("<BR/>")
            End If

            If Errors.Length > 0 Then
                ErrorPanel.Visible = True
                ErrorMessage.InnerHtml = Errors.ToString()
                Return False
            Else
                ErrorPanel.Visible = False
                ErrorMessage.InnerHtml = ""
                Return True
            End If

        End Function

        Private Sub ClearFields()

            proposalName.Text = ""

            firstName.Text = ""
            lastName.Text = ""
            address1.Text = ""
            address2.Text = ""
            city.Text = ""
            state.Text = ""
            country.Text = ""
            zipcode.Text = ""

            email.Text = ""
            phone.Text = ""
            phoneEve.Text = ""
            fax.Text = ""

            RemodelerRate.Text = ""
            PlumberRate.Text = ""
            TinnerRate.Text = ""
            ElectricianRate.Text = ""
            DesignerRate.Text = ""
            MaterialMarkup.Text = ""
            LaborMarkup.Text = ""
            SubMarkup.Text = ""

        End Sub

        Private Sub SetVisibility()
            UpdateControlMode(False)

            If ControlMode = PageMode.Edit Then
                ItemGroupsPanel.Visible = True
                btnSave.Visible = True
                btnCancel.Visible = True
                btnCreate.Visible = False
            Else
                ItemGroupsPanel.Visible = False
                btnSave.Visible = False
                btnCancel.Visible = False
                btnCreate.Visible = True
            End If
        End Sub

        Private Sub UpdateControlMode(ByVal isReadOnly As Boolean)

            proposalName.ReadOnly = isReadOnly

            firstName.ReadOnly = isReadOnly
            lastName.ReadOnly = isReadOnly
            address1.ReadOnly = isReadOnly
            address2.ReadOnly = isReadOnly
            city.ReadOnly = isReadOnly
            state.ReadOnly = isReadOnly
            country.ReadOnly = isReadOnly
            zipcode.ReadOnly = isReadOnly
            phone.ReadOnly = isReadOnly
            phoneEve.ReadOnly = isReadOnly
            fax.ReadOnly = isReadOnly
            email.ReadOnly = isReadOnly

            RemodelerRate.ReadOnly = isReadOnly
            PlumberRate.ReadOnly = isReadOnly
            TinnerRate.ReadOnly = isReadOnly
            ElectricianRate.ReadOnly = isReadOnly
            DesignerRate.ReadOnly = isReadOnly
            MaterialMarkup.ReadOnly = isReadOnly
            LaborMarkup.ReadOnly = isReadOnly
            SubMarkup.ReadOnly = isReadOnly

            GroupName.ReadOnly = isReadOnly
        End Sub

        Private Sub DataBindStates()

            Dim States As EntityCollection(Of StateEntity) = _BaseClassManager.StateList("Select State")

            state.DataSource = States
            state.DataTextField = "State"
            state.DataValueField = "StateID"
            state.DataBind()

        End Sub

        Private Sub DataBindCountries()

            'Get all countries and databind
            Dim Countries As EntityCollection(Of CountryEntity) = _BaseClassManager.CountryList("Select Country")

            country.DataSource = Countries
            country.DataTextField = "Country"
            country.DataValueField = "CountryID"
            country.DataBind()

        End Sub

        Private Sub DataBindOrderItemGroups()

            'Get all countries and databind
            Dim Groups As EntityCollection(Of OrderItemGroupEntity) = _OrderManager.OrderItemGroupList(Estimate.OrderId)

            If Groups.Count > 1 Then
                'don't allow editing of the 'Base Bid' group
                Groups.RemoveAt(0)
                GroupsGrid.DataSource = Groups
                GroupsGrid.DataBind()

                GroupsGrid.Visible = True
                GroupsGrid.Columns(1).Visible = True
                NoItemGroups.Visible = False
            Else
                GroupsGrid.Visible = False
                NoItemGroups.Visible = True
            End If

        End Sub

        Private Sub LoadData(ByVal OrderID As Integer)
            'load estimate we want to edit and persist to session state
            Estimate = _OrderManager.OrderSelect(OrderID)

            proposalName.Text = Estimate.Description
            firstName.Text = Estimate.BillFirstName
            lastName.Text = Estimate.BillLastName
            address1.Text = Estimate.BillAddr1
            address2.Text = Estimate.BillAddr2
            city.Text = Estimate.BillCity
            Dim StateId As Integer = _BaseClassManager.StateId(Estimate.BillState)
            If StateId > 0 Then
                state.SelectedValue = StateId.ToString()
            Else
                state.SelectedIndex = 0
            End If
            Dim CountryId As Integer = _BaseClassManager.CountryId(Estimate.BillCountry)
            If CountryId > 0 Then
                country.SelectedValue = CountryId.ToString()
            Else
                country.SelectedIndex = 0
            End If
            zipcode.Text = Estimate.BillZip
            phone.Text = Estimate.BillPhone
            phoneEve.Text = Estimate.BillPhoneEve
            fax.Text = Estimate.BillFax
            email.Text = Estimate.BillEmail

            RemodelerRate.Text = Estimate.RemodelerBillRate.ToString("c")
            PlumberRate.Text = Estimate.PlumberBillRate.ToString("c")
            TinnerRate.Text = Estimate.TinnerBillRate.ToString("c")
            ElectricianRate.Text = Estimate.ElectricianBillRate.ToString("c")
            DesignerRate.Text = Estimate.DesignerBillRate.ToString("c")
            MaterialMarkup.Text = Estimate.MaterialMarkup.ToString()
            LaborMarkup.Text = Estimate.LaborMarkup.ToString()
            SubMarkup.Text = Estimate.SubMarkup.ToString()

            If ControlMode = PageMode.Add Then
                If Estimate.IsTemplate Then
                    lblTitle.Text = "Create New Estimate Template"
                Else
                    lblTitle.Text = "Create New Estimate"
                End If
            Else
                If Estimate.IsTemplate Then
                    lblTitle.Text = "Edit Estimate Template"
                Else
                    lblTitle.Text = "Edit Estimate"
                End If
            End If

            'If Estimate.IsTemplate Then
            '    'Kill the active estimate, since we're now editing an estimate template
            '    Estimate = Nothing
            'End If

        End Sub

        Private Function IsValidRateInput(ByVal Text As String) As Boolean
            If Not String.IsNullOrEmpty(Text) Then
                If IsNumeric(Text) Then
                    If CDec(Text) > 0 Then
                        Return True
                    End If
                End If
            End If
            Return False
        End Function

        Private Function IsValidMarkupInput(ByVal Text As String) As Boolean
            Return IsValidRateInput(Text)
        End Function

        Private Sub SetSubscriberDefaults()
            RemodelerRate.Text = Subscriber.RemodelerBillRate.ToString("c")
            PlumberRate.Text = Subscriber.PlumberBillRate.ToString("c")
            TinnerRate.Text = Subscriber.TinnerBillRate.ToString("c")
            ElectricianRate.Text = Subscriber.ElectricianBillRate.ToString("c")
            DesignerRate.Text = Subscriber.DesignerBillRate.ToString("c")
            MaterialMarkup.Text = Subscriber.MaterialMarkup.ToString()
            LaborMarkup.Text = Subscriber.LaborMarkup.ToString()
            SubMarkup.Text = Subscriber.SubMarkup.ToString()
        End Sub

#End Region

    End Class

End Namespace
