Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class FixOrderItems
        Inherits System.Web.UI.Page

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then
            End If


        End Sub

        Protected Sub btnFix_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnFix.Click
            FixOrderItemInfo(114)
            FixOrderItemInfo(125)
            FixOrderItemInfo(18)
        End Sub

        Private Sub FixOrderItemInfo(ByVal OrderID As Integer)
            Dim OrderManager As New OrderManager()
            Dim TreeManager As New TreeManager()
            Dim RootChildNodeID As Integer
            Dim RootChildName As String = ""
            Dim OrderItems As EntityCollection(Of OrderItemEntity) = OrderManager.OrderItemList(OrderID)
            For Each OrderItem As OrderItemEntity In OrderItems
                Dim Node As NodeItemViewEntity = TreeManager.NodeSelectByItemID(OrderItem.ItemId)
                TreeManager.GetFirstRootChildNode(Node.NodeId, RootChildNodeID, RootChildName)
                OrderItem.RootChildNodeId = RootChildNodeID
                OrderItem.RootChildNodeName = RootChildName
                OrderManager.OrderItemUpdate(OrderItem)
            Next
        End Sub

    End Class


End Namespace
