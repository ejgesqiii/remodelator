Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Home
        Inherits PageBase

        Dim _TreeManager As New TreeManager()


#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
            If IsAuthenticated And Not IsNothing(Subscriber) Then
                Response.Redirect("SubscriberHome.aspx", True)
            End If

            SetVisibility()

            If Not Page.IsPostBack Then

            End If

        End Sub


        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            If Not IsNothing(Session("Timeout")) AndAlso Session("Timeout") = True Then
                TimeoutMessage.Visible = False
                Session("Timeout") = False
            End If

            Me.Title = "Remodelator | Construction Software for Estimating & Project Management"
        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub SetVisibility()

            Master.ColumnCount = 2

        End Sub

#End Region

    End Class

End Namespace
