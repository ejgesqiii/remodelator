Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class TreeNodeLoader
        Inherits System.Web.UI.Page

        Dim _TreeManager As New TreeManager()
        Dim _ItemManager As New ItemManager()
        Dim _BaseClassManager As New BaseClassManager

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then
            End If

        End Sub

        Private Sub BuildNodeHierarchy(ByVal Node As TreeNode, ByVal ParentID As Nullable(Of Integer), ByVal CurrentPosition As Integer)
            Dim NodeData As NodeItemViewEntity
            Dim NodeTypeID As Integer
            Dim LastParentID As Integer
            Dim ChildPosition As Integer = 0

            If Node.ChildNodes.Count = 0 Then
                NodeTypeID = 1
            Else
                NodeTypeID = 2
            End If

            NodeData = _TreeManager.NodeInsert(ParentID, Node.Text, NodeTypeID, Nothing, CurrentPosition)
            LastParentID = NodeData.NodeId

            'recurse children
            For Each TreeNode As TreeNode In Node.ChildNodes
                BuildNodeHierarchy(TreeNode, LastParentID, ChildPosition)
                ChildPosition = ChildPosition + 1
            Next
        End Sub

        Protected Sub LoadSpreadsheetItems_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles LoadSpreadsheetItems.Click
            'Loads all data from a spreadsheet into the tree structure
            Dim IM As New ImportManager
            IM.PopulateSpreadsheetItems()
        End Sub

        Protected Sub LoadTreeHierarchy_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles LoadTreeHierarchy.Click
            Dim CurrentPosition As Integer = 0
            For Each Node As TreeNode In TreeView1.Nodes
                BuildNodeHierarchy(Node, Nothing, CurrentPosition)
                CurrentPosition = CurrentPosition + 1
            Next
        End Sub

        Protected Sub AssignCodePrefix_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles AssignCodePrefix.Click
            'get tree root nodes
            Dim CodeBegin, CodeMid As String
            Dim RootNodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetRootNodes()
            Dim ChildNodes As EntityCollection(Of NodeItemViewEntity)
            For Each RootNode As NodeItemViewEntity In RootNodes
                CodeBegin = RootNode.Name.Substring(0, 3).ToUpper()

                ChildNodes = _TreeManager.GetNodeChildren(RootNode.NodeId)
                For Each ChildNode As NodeItemViewEntity In ChildNodes
                    CodeMid = ChildNode.Name.Substring(0, 3).ToUpper()
                    ChildNode.Prefix = CodeBegin + CodeMid
                    _TreeManager.NodeUpdate(ChildNode, ChildNode.Position, ChildNode.ParentId)
                Next

                'associate the tab with a default node
                Dim Tab As TabEntity = _BaseClassManager.TabSelect(RootNode.Name)
                Tab.NodeId = RootNode.NodeId
                _BaseClassManager.TabUpdate(Tab)

            Next

            _ItemManager.AssignItemCodes(1)
            _ItemManager.AssignItemCodes(3)
        End Sub

    End Class

End Namespace
