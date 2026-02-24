Option Strict On

Imports Microsoft.VisualBasic
Imports System.Diagnostics
Imports System.ComponentModel
Imports System.IO
Imports System.Drawing
Imports System.Drawing.Imaging
Imports System.Collections.Generic

Imports ClozWebControls
Imports RemodelatorBLL
Imports RemodelatorDAL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses
Imports RemodelatorDAL.FactoryClasses
Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class EditProfile
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()
        Dim _ItemManager As New ItemManager()
        Dim _BaseClassManager As New BaseClassManager()

        Public Reload As Boolean = False

#Region "Public Properties"


#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            ErrorPanel.Visible = False
            ErrorMessage.InnerHtml = ""
            SuccessPanel.Visible = False
            SuccessPanel.InnerHtml = ""

            If Not Page.IsPostBack Then
                'CreateVendor.Attributes("href") = "javascript:" & ucVendorAddEdit.DialogId & ".Show();"
            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            SetVisibility()

            If Not Page.IsPostBack Then
            End If

            If ControlMode = PageMode.Add Then
                lblActionTitle.Text = "Create New Profile"
                Eula.Visible = True
            Else
                lblActionTitle.Text = "Edit Profile"
                Eula.Visible = False
            End If

            If Reload Then
                LoadData()
            End If
        End Sub

#End Region

#Region "Control Events"

        ''' <summary>
        ''' Fires when Save is clicked
        ''' </summary>
        ''' <param name="sender"></param>
        ''' <param name="e"></param>
        ''' <remarks></remarks>
        Protected Sub btnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSave.Click

            If Not ValidateFields() Then
                Return
            End If

            Dim UserManager As New UserManager()
            If IsNothing(Subscriber) Then
                Subscriber = New SubscriberEntity()
            End If
            'Dim User As SubscriberEntity = UserManager.SubscriberSelect(Subscriber.SubscriberId)
            Subscriber.CompanyName = companyName.Text
            Subscriber.FirstName = firstName.Text
            Subscriber.LastName = lastName.Text
            Subscriber.Addr1 = address1.Text
            Subscriber.Addr2 = address2.Text
            Subscriber.City = city.Text
            Subscriber.State = state.Text
            Subscriber.Country = country.Text
            Subscriber.Zip = zipcode.Text

            Subscriber.Email = email.Text
            Subscriber.Username = username.Text
            If password.Text <> "" Then
                Subscriber.Password = password.Text
            End If
            Subscriber.HintId = CInt(hint.SelectedValue)
            Subscriber.Answer = answer.Text

            Subscriber.RemodelerBillRate = CDec(RemodelerRate.Text)
            Subscriber.PlumberBillRate = CDec(PlumberRate.Text)
            Subscriber.TinnerBillRate = CDec(TinnerRate.Text)
            Subscriber.ElectricianBillRate = CDec(ElectricianRate.Text)
            Subscriber.DesignerBillRate = CDec(DesignerRate.Text)
            Subscriber.MaterialMarkup = CDec(MaterialMarkup.Text)
            Subscriber.LaborMarkup = CDec(LaborMarkup.Text)
            Subscriber.SubMarkup = CDec(SubMarkup.Text)

            If Subscriber.IsNew Then
                UserManager.SubscriberInsert(Subscriber)
            Else
                UserManager.SubscriberUpdate(Subscriber)
            End If
            UserManager.SubscriberUpdate(Subscriber)

            If ControlMode = PageMode.Add Then
                'TODO: Login the user in and go to the subscriber home page
                Response.Redirect("Home.aspx")
            Else
                ControlMode = PageMode.View
            End If

        End Sub

        Protected Sub btnCancel_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnCancel.Click
            If ControlMode = PageMode.Add Then
                Response.Redirect("Home.aspx")
            Else
                ControlMode = PageMode.View
            End If
        End Sub


#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub LoadData()

            DataBindStates()
            DataBindCountries()
            DataBindHints()

            If Not IsNothing(Subscriber) Then
                companyName.Text = Subscriber.CompanyName
                firstName.Text = Subscriber.FirstName
                lastName.Text = Subscriber.LastName
                address1.Text = Subscriber.Addr1
                address2.Text = Subscriber.Addr2
                city.Text = Subscriber.City
                Dim StateId As Integer = _BaseClassManager.StateId(Subscriber.State)
                If StateId > 0 Then
                    state.SelectedValue = StateId.ToString()
                Else
                    state.SelectedIndex = 0
                End If
                Dim CountryId As Integer = _BaseClassManager.CountryId(Subscriber.Country)
                If CountryId > 0 Then
                    country.SelectedValue = CountryId.ToString()
                Else
                    country.SelectedIndex = 0
                End If
                zipcode.Text = Subscriber.Zip
                email.Text = Subscriber.Email
                username.Text = Subscriber.Username
                password.Text = Subscriber.Password
                If Subscriber.HintId.GetValueOrDefault() > 0 Then
                    hint.SelectedValue = Subscriber.HintId.ToString()
                Else
                    hint.SelectedIndex = 0
                End If

                answer.Text = Subscriber.Answer

                RemodelerRate.Text = Subscriber.RemodelerBillRate.ToString("c")
                PlumberRate.Text = Subscriber.PlumberBillRate.ToString("c")
                TinnerRate.Text = Subscriber.TinnerBillRate.ToString("c")
                ElectricianRate.Text = Subscriber.ElectricianBillRate.ToString("c")
                DesignerRate.Text = Subscriber.DesignerBillRate.ToString("c")
                MaterialMarkup.Text = Subscriber.MaterialMarkup.ToString()
                LaborMarkup.Text = Subscriber.LaborMarkup.ToString()
                SubMarkup.Text = Subscriber.SubMarkup.ToString()
            Else
                ClearFields()
            End If
            
        End Sub

        Private Sub ClearFields()

            companyName.Text = ""
            firstName.Text = ""
            lastName.Text = ""
            address1.Text = ""
            address2.Text = ""
            city.Text = ""
            state.Text = ""
            country.Text = ""
            zipcode.Text = ""

            email.Text = ""
            username.Text = ""
            password.Text = ""
            password2.Text = ""
            hint.Text = ""
            answer.Text = ""

            RemodelerRate.Text = ""
            PlumberRate.Text = ""
            TinnerRate.Text = ""
            ElectricianRate.Text = ""
            DesignerRate.Text = ""
            MaterialMarkup.Text = "1"
            LaborMarkup.Text = "1"
            SubMarkup.Text = "1"

        End Sub

        Private Sub SetVisibility()

            If ControlMode = PageMode.View Or ControlMode = PageMode.Locked Then
                UpdateControlMode(True)
            Else
                UpdateControlMode(False)
            End If
           
        End Sub

        Private Sub UpdateControlMode(ByVal isReadOnly As Boolean)

            companyName.ReadOnly = isReadOnly
            firstName.ReadOnly = isReadOnly
            lastName.ReadOnly = isReadOnly
            address1.ReadOnly = isReadOnly
            address2.ReadOnly = isReadOnly
            city.ReadOnly = isReadOnly
            state.ReadOnly = isReadOnly
            country.ReadOnly = isReadOnly
            zipcode.ReadOnly = isReadOnly

            email.ReadOnly = isReadOnly
            username.ReadOnly = isReadOnly
            password.ReadOnly = isReadOnly
            password2.ReadOnly = isReadOnly
            hint.ReadOnly = isReadOnly
            answer.ReadOnly = isReadOnly

            RemodelerRate.ReadOnly = isReadOnly
            PlumberRate.ReadOnly = isReadOnly
            TinnerRate.ReadOnly = isReadOnly
            ElectricianRate.ReadOnly = isReadOnly
            MaterialMarkup.ReadOnly = isReadOnly
            DesignerRate.ReadOnly = isReadOnly
            LaborMarkup.ReadOnly = isReadOnly
            SubMarkup.ReadOnly = isReadOnly

        End Sub

        Public Function ValidateFields() As Boolean
            Dim Errors As New StringBuilder()

            If ControlMode = PageMode.Add And btnLicense.SelectedIndex <> 0 Then
                Errors.Append("You must accept the terms of the license agreement or your account will not be registered.").Append("<BR/>")
            End If

            If companyName.Text = "" Then
                Errors.Append("Company Name not specified.").Append("<BR/>")
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

            If email.Text = "" Then
                Errors.Append("Email address not specified.").Append("<BR/>")
            End If
            If username.Text = "" Then
                Errors.Append("Username not specified.").Append("<BR/>")
            End If
            If password.Text = "" And ControlMode = PageMode.Add Then
                Errors.Append("Password not specified.").Append("<BR/>")
            ElseIf password.Text <> password2.Text Then
                Errors.Append("Your passwords do not match. Please re-enter.").Append("<BR/>")
            End If
            If hint.SelectedIndex = 0 Then
                Errors.Append("Password Hint not specified.").Append("<BR/>")
            End If
            If answer.Text = "" Then
                Errors.Append("Hint Answer not specified.").Append("<BR/>")
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

        Private Sub DataBindHints()

            'Get all countries and databind
            Dim Hints As EntityCollection(Of HintEntity) = _BaseClassManager.HintList("Select Hint")

            hint.DataSource = Hints
            hint.DataTextField = "Hint"
            hint.DataValueField = "HintID"
            hint.DataBind()

        End Sub

#End Region

    End Class

End Namespace
