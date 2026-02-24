Imports System.Diagnostics
Imports System.Collections.Generic
Imports System.Drawing

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Estimate
        Inherits PageBase

        Dim _AltRowIndex As Integer = -1
        Dim _BaseClassManager As New BaseClassManager()
        Dim _OrderManager As New OrderManager()
        Dim _ItemManager As New ItemManager()

#Region "Public Properties"

        Public Property SelectedTabID() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("SelectedTabID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("SelectedTabID") = value
            End Set
        End Property

        Public Property SelectedNodeID() As String
            Get
                Dim o As Object = ViewState("SelectedNodeID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CStr(o)
                End If
            End Get
            Set(ByVal value As String)
                ViewState("SelectedNodeID") = value
            End Set
        End Property

        Public Property LineID() As Integer
            Get
                Dim o As Object = ViewState("LineID")
                If IsNothing(o) Then
                    Return 0
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("LineID") = value
            End Set
        End Property

        Public Property LastEditIndex() As Integer
            Get
                Dim o As Object = ViewState("LastEditIndex")
                If IsNothing(o) Then
                    Return -1
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("LastEditIndex") = value
            End Set
        End Property

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If

            ErrorPanel.Visible = False
            OrderItemDetail = Nothing

            If Not Page.IsPostBack Then
                Dim QueryValue As String = Request.QueryString("ID")
                If Not String.IsNullOrEmpty(QueryValue) Then
                    Dim OrderID As Integer = CInt(QueryValue)
                    If IsNothing(Estimate) OrElse Estimate.OrderId <> OrderID Then
                        'the estimate was changed from what was previously viewed, so clear out the last item selection
                        LastItemSelectionNodeID = 0
                    End If
                    Estimate = _OrderManager.OrderSelect(CInt(QueryValue))
                    If IsNothing(Estimate) Then
                        'TODO: another user deleted the estimate - handle error
                    End If
                End If

                BindDataGrid()

                EditPanel.Visible = False

                QueryValue = Request.QueryString("TabId")
                If Not String.IsNullOrEmpty(QueryValue) Then
                    SelectedTabID = CInt(QueryValue)
                End If
                QueryValue = Request.QueryString("NodeId")
                If Not String.IsNullOrEmpty(QueryValue) Then
                    SelectedNodeID = QueryValue
                End If

            End If

            WebUtils.AddJSForScrollPosition(Me.ParentPage, "OrderItemsScroll", "OrderItemsScrollPos", False)
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            Master.ColumnCount = 1

            Name.ReadOnly = True
            ExtPrice.ReadOnly = True
            Qty.ReadOnly = False
            RemUnits.ReadOnly = False
            ElecUnits.ReadOnly = False
            PlumUnits.ReadOnly = False
            TinUnits.ReadOnly = False
            DesignUnits.ReadOnly = False
            Comment.ReadOnly = False
            MaterialMarkup.ReadOnly = False
            LaborMarkup.ReadOnly = False
            SubMarkup.ReadOnly = False

            Dim jsFunctionCall As String = String.Format("GetPrice('{0}')", "ctl00_CP_")
            Qty.Attributes("onchange") = jsFunctionCall
            RemUnits.Attributes("onchange") = jsFunctionCall
            ElecUnits.Attributes("onchange") = jsFunctionCall
            PlumUnits.Attributes("onchange") = jsFunctionCall
            TinUnits.Attributes("onchange") = jsFunctionCall
            DesignUnits.Attributes("onchange") = jsFunctionCall
            MaterialMarkup.Attributes("onchange") = jsFunctionCall
            LaborMarkup.Attributes("onchange") = jsFunctionCall
            SubMarkup.Attributes("onchange") = jsFunctionCall

            If ErrorPanel.Visible Then
                ExtPrice.Text = "$0.00"
            End If

            TotalPrice.Text = "Total Price: " & Format(Estimate.OrderTotal, "c")
            TotalPrice.Visible = False

            JobBanner.InnerHtml = Utilities.GetEstimateBanner(Estimate, False, LastItemSelectionNodeID)
            JobBanner.Visible = (JobBanner.InnerHtml <> "")

        End Sub

#End Region

#Region "Control Events"

        Protected Sub EstimateGrid_RowCommand(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewCommandEventArgs) Handles EstimateGrid.RowCommand
            If e.CommandName = "View" Then
                Dim LineID As Integer = CInt(e.CommandArgument)
                'Navigate to the page containing the NodeID corresponding to the ItemID of the LineID
                'Autoselect NodeID associated with the line id
                'populate the quantity fields on the item selection screen
                'if the user saves changes, allow update of existing info
                Dim TreeManager As New TreeManager()
                Dim OrderItem As OrderItemDetailViewEntity = _OrderManager.OrderItemDetailViewSelect(LineID)            'hit db
                If Not IsNothing(OrderItem) Then
                    'get ancestor nodes so we can find root node to open
                    Dim Ancestors As EntityCollection(Of TreeEntity) = TreeManager.TreeAncestorList(OrderItem.NodeId)   'hit db
                    Dim RootNodeID As Integer = Ancestors(0).ParentId
                    'Get the tab that the root child is on
                    Dim Tab As TabEntity = _BaseClassManager.TabSelectByNodeID(RootNodeID)
                    Dim NavURL As String = String.Format(Tab.NavigateUrl & ".aspx?NodeID={0}&LineID={1}", RootNodeID, LineID)
                    Response.Redirect(NavURL, True)
                End If
            End If
        End Sub

        Protected Sub EstimateGrid_RowDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewRowEventArgs) Handles EstimateGrid.RowDataBound
            'massage the grid contents
            'Dim ViewLink As LinkButton
            If e.Row.RowType = DataControlRowType.DataRow Then
                Dim OrderItem As OrderItemDetailViewEntity = CType(e.Row.DataItem, OrderItemDetailViewEntity)
                'If OrderItem.Inactive Or OrderItem.NodeTypeId = 3 Then
                '    'we have an accessory item, so hide the View link
                '    ViewLink = CType(e.Row.FindControl("btnView"), LinkButton)
                '    ViewLink.Visible = False
                '    If IsNothing(OrderItem.BaseLineId) Then
                '        e.Row.ForeColor = Color.Red
                '    End If
                'End If
                If OrderItem.LineId < 0 Then
                    e.Row.Cells.RemoveAt(6)
                    e.Row.Cells.RemoveAt(5)
                    e.Row.Cells.RemoveAt(4)
                    e.Row.Cells.RemoveAt(3)
                    e.Row.Cells.RemoveAt(1)
                    e.Row.Cells.RemoveAt(0)
                    e.Row.Cells(0).Text = OrderItem.Name
                    e.Row.Cells(0).ColumnSpan = 6
                    e.Row.HorizontalAlign = HorizontalAlign.Left
                    e.Row.Font.Bold = True
                    If OrderItem.LineId = -3 Then
                        'totals row 
                        e.Row.Width = New Unit("100%")
                        e.Row.Cells(0).HorizontalAlign = HorizontalAlign.Right
                    ElseIf OrderItem.LineId = -2 Then
                        'group row
                        e.Row.BackColor = Color.LightSlateGray
                        e.Row.ForeColor = Color.White
                    ElseIf OrderItem.LineId = -1 Then
                        'parent row
                        e.Row.BackColor = Color.SkyBlue
                        e.Row.ForeColor = Color.Black
                    End If
                    _AltRowIndex = -1
                Else
                    If Estimate.Locked Then
                        Dim btnEdit As LinkButton = CType(e.Row.FindControl("btnEdit"), LinkButton)
                        btnEdit.Visible = False
                        Dim btnDelete As LinkButton = CType(e.Row.FindControl("btnDelete"), LinkButton)
                        btnDelete.Visible = False
                    End If
                    _AltRowIndex = _AltRowIndex + 1
                    If _AltRowIndex Mod 2 = 1 Then
                        'change row color
                        e.Row.Attributes("class") = "AltRow"
                    End If
                    If OrderItem.Inactive Then
                        'display font in red to indicate item is no longer available
                        e.Row.ForeColor = Color.Red
                    End If
                End If
            End If

        End Sub

        Protected Sub EstimateGrid_RowDeleting(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewDeleteEventArgs) Handles EstimateGrid.RowDeleting
            Dim LineID As Integer = CInt(EstimateGrid.DataKeys(e.RowIndex).Value)
            _OrderManager.OrderItemDelete(LineID)

            'Calculate the new order total
            Estimate.OrderTotal = _OrderManager.CalculateOrderTotal(Estimate.OrderId)
            _OrderManager.OrderUpdate(Estimate)

            BindDataGrid()
        End Sub

        Protected Sub EstimateGrid_RowEditing(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewEditEventArgs) Handles EstimateGrid.RowEditing
            Dim Row As GridViewRow
            Dim Index As Integer = e.NewEditIndex

            LineID = CInt(EstimateGrid.DataKeys(Index).Value)

            ClearLastEditRow()

            LastEditIndex = Index

            'set style to indicate row being edited
            Row = EstimateGrid.Rows(Index)
            'border outlining only works in FF!
            'Row.BorderStyle = BorderStyle.Solid
            'Row.BorderWidth = Unit.Pixel(2)
            'Row.BorderColor = Color.Black
            Row.BackColor = Color.Red
            Row.ForeColor = Color.White
            Row.Font.Bold = True

            EditPanel.Visible = True
            LoadEditPanel()

            'don't allow any other row to be edited
            For Each Row In EstimateGrid.Rows
                If Row.Cells(0).Text <> "" Then
                    'header or totals row
                    'TODO: why do I have to fixup the columns again, since this was just done in the DataBound event
                    Dim Header As String = Row.Cells(0).Text
                    Row.Cells.RemoveAt(6)
                    Row.Cells.RemoveAt(5)
                    Row.Cells.RemoveAt(4)
                    Row.Cells.RemoveAt(3)
                    Row.Cells.RemoveAt(1)
                    Row.Cells.RemoveAt(0)
                    Row.Cells(0).Text = Header
                    Row.Cells(0).ColumnSpan = 6
                    If Header.Contains("Total") Then    'HACK
                        Row.Cells(0).HorizontalAlign = HorizontalAlign.Right
                    End If
                Else
                    Row.Cells(0).Controls.Clear()
                End If
            Next
        End Sub

        Protected Sub btnCancel_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnCancel.Click
            EditPanel.Visible = False

            'clear edit row style
            ClearLastEditRow()

            BindDataGrid()
        End Sub

        Protected Sub btnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSave.Click
            If ValidateFields() Then

                Dim OrderItem As OrderItemEntity = _OrderManager.OrderItemSelect(LineID)

                OrderItem.RemodelerProdRate = CDec(RemUnits.Text)
                OrderItem.ElectricianProdRate = CDec(ElecUnits.Text)
                OrderItem.PlumberProdRate = CDec(PlumUnits.Text)
                OrderItem.TinnerProdRate = CDec(TinUnits.Text)
                OrderItem.DesignerProdRate = CDec(DesignUnits.Text)
                OrderItem.MaterialMarkup = CDec(MaterialMarkup.Text)
                OrderItem.LaborMarkup = CDec(LaborMarkup.Text)
                OrderItem.SubMarkup = CDec(SubMarkup.Text)
                OrderItem.Qty = Qty.Text
                OrderItem.NetPrice = _ItemManager.ItemPrice(CDec(Price_val.Value), OrderItem, Estimate)
                OrderItem.ExtPrice = OrderItem.Qty * OrderItem.NetPrice
                OrderItem.Comments = Comment.Text

                'Get the item group
                Dim NewItemGroupID As Nullable(Of Integer) = GetItemGroupID()
                If OrderItem.GroupId.GetValueOrDefault() <> NewItemGroupID.GetValueOrDefault() Then
                    'the item group has changed, so apply the new group to all related item accessories as well
                    Dim AccOrderItems As EntityCollection(Of OrderItemEntity) = _OrderManager.OrderItemList(Estimate.OrderId, OrderItem.LineId)
                    For Each AccOrderItem As OrderItemEntity In AccOrderItems
                        AccOrderItem.GroupId = NewItemGroupID
                        'TODO: save collection instead of each item separately
                        _OrderManager.OrderItemUpdate(AccOrderItem)
                    Next
                End If

                OrderItem.GroupId = NewItemGroupID
                _OrderManager.OrderItemUpdate(OrderItem)

                'Calculate the new order total
                Estimate.OrderTotal = _OrderManager.CalculateOrderTotal(Estimate.OrderId)
                _OrderManager.OrderUpdate(Estimate)

                EditPanel.Visible = False

                'if we don't redatabind, we lose the formatting of the grid!
                BindDataGrid()

                'clear edit row style
                ClearLastEditRow()
            Else
                'if we don't redatabind, we lose the formatting of the grid
                BindDataGrid()
                For Each Row As GridViewRow In EstimateGrid.Rows
                    'validate failed, so hide action links
                    Row.Cells(0).Controls.Clear()
                Next
                'set style to indicate row being edited
                Dim EditingRow As GridViewRow = EstimateGrid.Rows(LastEditIndex)
                EditingRow.BackColor = Color.Red
                EditingRow.ForeColor = Color.White
                EditingRow.Font.Bold = True
            End If
        End Sub

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Public Function ValidateFields() As Boolean
            Dim Errors As New StringBuilder()

            If Not IsPositiveInteger(Qty.Text, False) Then
                Errors.Append("Item quantity must be 1 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(RemUnits.Text) Then
                Errors.Append("Remodeler Units must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(ElecUnits.Text) Then
                Errors.Append("Electrician Units must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(PlumUnits.Text) Then
                Errors.Append("Plumber Units must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(TinUnits.Text) Then
                Errors.Append("Tinner Units must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(DesignUnits.Text) Then
                Errors.Append("Designer Units must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(MaterialMarkup.Text) Then
                Errors.Append("Materal Markup must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(LaborMarkup.Text) Then
                Errors.Append("Labor Markup must be 0 or greater.").Append("<BR/>")
            End If
            If Not IsPositiveNumber(SubMarkup.Text) Then
                Errors.Append("Subcontractor markup must be 0 or greater.").Append("<BR/>")
            End If
            If ItemGroups.Text.Length > 50 Then
                Errors.Append("Item Group name must be 50 characters or less.").Append("<BR/>")
            End If
            If Comment.Text.Length > 255 Then
                Errors.Append("Comment must be 255 characters or less.").Append("<BR/>")
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

        Private Sub LoadEditPanel()
            Dim SelectedDetail As OrderItemDetailViewEntity = _OrderManager.OrderItemDetailViewSelect(LineID)

            Name.Text = SelectedDetail.Name
            ExtPrice.Text = Format(SelectedDetail.ExtPrice, "c")
            Qty.Text = SelectedDetail.Qty
            RemUnits.Text = SelectedDetail.RemodelerProdRate
            ElecUnits.Text = SelectedDetail.ElectricianProdRate
            PlumUnits.Text = SelectedDetail.PlumberProdRate
            TinUnits.Text = SelectedDetail.TinnerProdRate
            DesignUnits.Text = SelectedDetail.DesignerProdRate
            Price_val.Value = SelectedDetail.Price
            MaterialMarkup.Text = SelectedDetail.MaterialMarkup
            LaborMarkup.Text = SelectedDetail.LaborMarkup
            SubMarkup.Text = SelectedDetail.SubMarkup

            Comment.Text = SelectedDetail.Comments

            'Get the item groups
            DataBindItemGroups()

            If SelectedDetail.GroupId > 0 Then
                'TODO: doesn't work!
                ItemGroups.Text = _OrderManager.OrderItemGroupSelect(SelectedDetail.GroupId).Name
                ItemGroups.SelectedValue = SelectedDetail.GroupId.ToString()
            Else
                ItemGroups.SelectedIndex = 0
            End If

            'if we are editing an accessory, don't allow changing the Item Group
            ItemGroups.Enabled = IsNothing(SelectedDetail.BaseLineId)
            
        End Sub

        Private Sub DataBindItemGroups()
            Dim Collection As EntityCollection(Of OrderItemGroupEntity) = _OrderManager.OrderItemGroupList(Estimate.OrderId)

            ItemGroups.DataSource = Collection
            ItemGroups.DataTextField = "Name"
            ItemGroups.DataValueField = "GroupID"
            ItemGroups.DataBind()

        End Sub

        Private Sub BindDataGrid()
            Dim Data As EntityCollection(Of OrderItemDetailViewEntity) = _OrderManager.OrderItemDetailViewList(Estimate.OrderId, GridType.Estimate)
            'add dummy rows for the header columns
            EstimateGrid.DataSource = Data
            EstimateGrid.DataBind()
        End Sub

        Private Sub ClearLastEditRow()
            If LastEditIndex > -1 Then
                Dim Row As GridViewRow = EstimateGrid.Rows(LastEditIndex)
                Row.BorderStyle = BorderStyle.None
                Row.BorderWidth = Unit.Pixel(0)
                Row.BorderColor = Color.Transparent
                Row.Font.Bold = False
                LastEditIndex = -1
            End If
        End Sub

        Private Function GetItemGroupID() As Nullable(Of Integer)
            If ItemGroups.Text.ToLower() <> "base bid" Then
                Dim OrderItemGroup As OrderItemGroupEntity = _OrderManager.OrderItemGroupSelect(ItemGroups.Text)
                If IsNothing(OrderItemGroup) Then
                    'create new and return new id
                    OrderItemGroup = New OrderItemGroupEntity()
                    OrderItemGroup.OrderId = Estimate.OrderId
                    OrderItemGroup.Name = ItemGroups.Text
                    OrderItemGroup = _OrderManager.OrderItemGroupInsert(OrderItemGroup)
                End If
                Return OrderItemGroup.GroupId
            Else
                Return Nothing
            End If
        End Function

#End Region

    End Class

End Namespace
