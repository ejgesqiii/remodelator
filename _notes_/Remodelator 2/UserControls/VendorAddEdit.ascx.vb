Option Strict On

Imports Microsoft.VisualBasic
Imports System.Diagnostics
Imports System.ComponentModel

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

    Partial Class VendorAddEdit
        Inherits ControlBase

        Dim _BaseClassManager As New BaseClassManager()
        Dim _Tree As TreeView
        Const TREE_CONTROL_NAME As String = "tvItems"
        Const PRODUCT_IMAGE_PATH As String = "../Images/Products/"
        Const PDF_PATH As String = "../PDFs/"

#Region "Public Properties"

        Public ReadOnly Property DialogId() As String
            Get
                Return Dialog1.ClientID
            End Get
        End Property

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            ErrorPanel.Visible = False
            ErrorMessage.InnerHtml = ""

            If Not Page.IsPostBack Then

            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            SetVisibility()
        End Sub

#End Region

#Region "Control Events"

        Protected Sub btnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSave.Click
            If Not ValidateFields() Then
                Return
            End If

            'This line of code doesn't work in IE, but does in FF. I believe it has something to do with the dialog object not being
            'available until after the page finishes loading
            'Page.ClientScript.RegisterStartupScript(Me.GetType(), "Test2", "<script language='javascript'>" & DialogId & ".Show();</script>")
            'This does work!
            Dim Script As String = "<script language='javascript'>ShowDialogWindow=function(){" & DialogId & ".Show();};AddOnload(ShowDialogWindow);</script>"
            Page.ClientScript.RegisterStartupScript(Me.GetType(), "Test", Script)

        End Sub

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Function ValidateFields() As Boolean
            Dim Errors As New StringBuilder()

            If String.IsNullOrEmpty(VendorName.Text) Then
                'folder editing
                Errors.Append("Vendor Name must be specified.").Append("<BR/>")
            Else
                Dim Vendor As VendorEntity = _BaseClassManager.VendorSelect(VendorName.Text)
                If Not IsNothing(Vendor) Then
                    Errors.Append("Vendor Name must be specified.").Append("<BR/>")
                End If
            End If

            If Errors.Length > 0 Then
                ErrorPanel.Visible = True
                ErrorMessage.InnerHtml = Errors.ToString().Trim("<BR/>".ToCharArray())
                Return False
            Else
                ErrorPanel.Visible = False
                ErrorMessage.InnerHtml = ""
                Return True
            End If

        End Function

        Private Sub SetVisibility()
            VendorName.ReadOnly = False
        End Sub

#End Region

    End Class

End Namespace
