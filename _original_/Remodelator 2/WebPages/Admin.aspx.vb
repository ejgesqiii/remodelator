Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Admin
        Inherits PageBase

        Dim _TreeManager As New TreeManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            SetVisibility()

            If Not IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If

            If Not Page.IsPostBack Then
                If Session("Mode") = AdminView.Item Then
                    TabStrip1.SelectedTab = TabStrip1.Tabs(0)
                Else
                    TabStrip1.SelectedTab = TabStrip1.Tabs(1)
                End If
            End If

            Me.Title = FormatPageTitle("Administration")

        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub SetVisibility()
            Master.ColumnCount = 1
        End Sub

#End Region

        Protected Sub TabStrip1_ItemSelected(ByVal sender As Object, ByVal e As ComponentArt.Web.UI.TabStripTabEventArgs) Handles TabStrip1.ItemSelected
            If TabStrip1.SelectedTab.GetCurrentIndex() = 0 Then
                Session("Mode") = AdminView.Item
                IC.Reload = True
            Else
                Session("Mode") = AdminView.ItemAccessory
                IC.Reload = True
            End If

        End Sub
    End Class

End Namespace
