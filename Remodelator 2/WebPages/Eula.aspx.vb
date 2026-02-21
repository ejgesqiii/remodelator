Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Eula
        Inherits PageBase

        Dim _TreeManager As New TreeManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then

            End If
        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

#End Region

        Protected Sub btnContinue_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnContinue.Click
            Response.Redirect("SubscriberHome.aspx")
        End Sub
    End Class

End Namespace
