Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class ItemView
        Inherits PageBase

        Dim _TreeManager As New TreeManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If

            If Not Page.IsPostBack Then

            End If

            Dim NodeID As Integer = CInt(Request.QueryString("ID"))
            Dim Node As NodeItemViewEntity = _TreeManager.NodeSelect(NodeID)
            ucItemDetail.NodeTypeId = Node.NodeTypeId
            ucItemDetail.NodeId = Node.NodeId
            ucItemDetail.Reload = True
        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

#End Region

    End Class

End Namespace
