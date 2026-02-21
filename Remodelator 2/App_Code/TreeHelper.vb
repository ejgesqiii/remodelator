Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Public Class TreeHelper

        Dim _BaseClassManager As New BaseClassManager()
        Dim _TreeManager As New TreeManager()
        Dim _Tree As TreeView
        Dim _Mode As AdminView

        Private Sub New()

        End Sub

        Public Sub New(ByVal Mode As AdminView, ByVal Tree As TreeView)
            _Mode = Mode
            _Tree = Tree
        End Sub

        ''' <summary>
        ''' Creates the tree to display for a selected menu item
        ''' </summary>
        ''' <param name="NodeId"></param>
        ''' <remarks></remarks>
        Public Sub BuildTree(ByVal NodeId As Nullable(Of Integer))
            Dim RootNode As NodeItemViewEntity
            Dim NewNode As TreeViewNode
            Dim ParentNode As TreeViewNode = Nothing

            If IsNothing(NodeId) Then
                Return
            End If

            Dim Node As NodeItemViewEntity = _TreeManager.NodeSelect(NodeId.GetValueOrDefault())

            _Tree.Nodes.Clear()

            If Not IsNothing(NodeId.GetValueOrDefault()) Then
                'get the parent folder associated with this tab
                RootNode = _TreeManager.NodeSelect(NodeId.GetValueOrDefault())
                If IsNothing(RootNode) Then
                    'there isn't any data associated with the NodeId value!
                    Return
                End If
                ParentNode = New TreeViewNode
                ParentNode.ImageUrl = Utilities.GetNodeImage(RootNode)
                ParentNode.Text = Utilities.GetNodeText(RootNode.Name, RootNode.NodeId, RootNode.Position)
                ParentNode.ID = NodeInfo.MakeNodeID(RootNode.NodeId, RootNode.NodeTypeId)
                If RootNode.NodeTypeId = 2 Then
                    'ParentNode.ContentCallbackUrl = "Request.aspx?ID=" & RootNode.NodeId & "&T=" & Rnd(12)
                    ParentNode.ContentCallbackUrl = "Request.aspx?ID=" & RootNode.NodeId
                End If

                ParentNode.Expanded = True

                _Tree.Nodes.Add(ParentNode)

                'now get the child nodes of the root node
                Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetNodeChildren(NodeId.GetValueOrDefault())

                For Each ChildNode As NodeItemViewEntity In Nodes
                    If _Mode = AdminView.Item And ChildNode.NodeTypeId = 3 Then
                        Continue For
                    End If
                    If _Mode = AdminView.ItemAccessory And ChildNode.NodeTypeId = 1 Then
                        Continue For
                    End If
                    NewNode = New TreeViewNode
                    NewNode.ImageUrl = Utilities.GetNodeImage(ChildNode)
                    NewNode.Text = Utilities.GetNodeText(ChildNode.Name, ChildNode.NodeId, ChildNode.Position)
                    NewNode.ID = NodeInfo.MakeNodeID(ChildNode.NodeId, ChildNode.NodeTypeId)
                    If ChildNode.NodeTypeId = 2 Then
                        'NewNode.ContentCallbackUrl = "Request.aspx?ID=" & ChildNode.NodeId & "&T=" & Rnd(12)
                        NewNode.ContentCallbackUrl = "Request.aspx?ID=" & ChildNode.NodeId
                    Else
                        If Not RootNode.EditsComplete Then
                            'Items whare aren't complete should appear in bold italic text
                            NewNode.CssClass = "TreeNodeNC"
                            NewNode.HoverCssClass = "HoverTreeNodeNC"
                            NewNode.SelectedCssClass = "SelectedTreeNodeNC"
                        End If
                    End If

                    ParentNode.Nodes.Add(NewNode)
                Next
            End If
        End Sub

        ''' <summary>
        ''' Builds a single top level node down to a selected node (if specified)
        ''' </summary>
        ''' <remarks></remarks>
        Public Sub BuildTree(ByVal NodeId As Nullable(Of Integer), ByVal SelectedNodeID As Nullable(Of Integer))

            If NodeId.GetValueOrDefault() = SelectedNodeID.GetValueOrDefault() Then
                'path when selecting tab across top of page
                BuildTree(NodeId)
                Return
            End If

            'path when loading Estimate item data onto item selection page
            Dim NewNode As TreeViewNode
            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetRootNodes

            'determine the path to the node that should be selected
            Dim TreeNodes As EntityCollection(Of TreeEntity) = _TreeManager.TreeAncestorList(SelectedNodeID)

            _Tree.Nodes.Clear()
            _Tree.SelectedNode = Nothing

            For Each RootNode As NodeItemViewEntity In Nodes
                If NodeId.GetValueOrDefault() = TreeNodes(0).ParentId Then
                    'the specified node is a root node
                    If RootNode.NodeId <> NodeId.GetValueOrDefault() Then
                        Continue For
                    End If
                Else
                    Continue For
                End If
                If _Mode = AdminView.Item And RootNode.NodeTypeId = 3 Then
                    Continue For
                End If
                If _Mode = AdminView.ItemAccessory And RootNode.NodeTypeId = 1 Then
                    Continue For
                End If
                NewNode = New TreeViewNode
                NewNode.ImageUrl = Utilities.GetNodeImage(RootNode)
                NewNode.Text = Utilities.GetNodeText(RootNode.Name, RootNode.NodeId, RootNode.Position)
                NewNode.ID = NodeInfo.MakeNodeID(RootNode.NodeId, RootNode.NodeTypeId)
                If RootNode.NodeTypeId = 2 Then
                    'NewNode.ContentCallbackUrl = "Request.aspx?ID=" & RootNode.NodeId & "&T=" & Rnd(12)
                    NewNode.ContentCallbackUrl = "Request.aspx?ID=" & RootNode.NodeId
                End If
                'Disable the ability to drop anything onto this node
                'NewNode.DroppingEnabled = False
                _Tree.Nodes.Add(NewNode)
                If TreeNodes.Count > 0 Then
                    If RootNode.NodeId = TreeNodes(0).ParentId Then
                        NewNode.Expanded = True
                        If RootNode.NodeId <> SelectedNodeID.GetValueOrDefault() Then
                            TreeNodes.RemoveAt(0)
                            BuildHierarchy(NewNode, RootNode.NodeId, TreeNodes, SelectedNodeID)
                        Else
                            'we found the selected node...get this node's direct children so user doesn't have to expand folder so
                            'see what's in it
                            BuildHierarchy(NewNode, RootNode.NodeId)
                            _Tree.SelectedNode = NewNode
                            NewNode.Expanded = True
                        End If
                    End If
                End If
            Next
        End Sub

        ''' <summary>
        ''' Only builds the top level nodes in the tree
        ''' </summary>
        ''' <remarks></remarks>
        Public Sub BuildTopLevelTree(Optional ByVal SelectedNodeID As Integer = -1)

            Dim NewNode As TreeViewNode

            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetRootNodes

            'determine the path to the node that should be selected
            Dim TreeNodes As EntityCollection(Of TreeEntity) = _TreeManager.TreeAncestorList(SelectedNodeID)

            _Tree.Nodes.Clear()
            _Tree.SelectedNode = Nothing
            'setup client side handler for drag/drop node to text box
            _Tree.ExternalDropTargets = "ctl00_CP_IC_IAE_FolderParentNode_val,ctl00_CP_IC_IAE_ItemParentNode_val"
            _Tree.ClientSideOnNodeExternalDrop = "TestFunc"

            For Each RootNode As NodeItemViewEntity In Nodes
                If _Mode = AdminView.Item And RootNode.NodeTypeId = 3 Then
                    Continue For
                End If
                If _Mode = AdminView.ItemAccessory And RootNode.NodeTypeId = 1 Then
                    Continue For
                End If
                NewNode = New TreeViewNode
                NewNode.ImageUrl = Utilities.GetNodeImage(RootNode)
                NewNode.Text = Utilities.GetNodeText(RootNode.Name, RootNode.NodeId, RootNode.Position)
                NewNode.ID = NodeInfo.MakeNodeID(RootNode.NodeId, RootNode.NodeTypeId)
                If RootNode.NodeTypeId = 2 Then
                    'NewNode.ContentCallbackUrl = "Request.aspx?ID=" & RootNode.NodeId & "&T=" & Rnd(12)
                    NewNode.ContentCallbackUrl = "Request.aspx?ID=" & RootNode.NodeId
                End If
                'Disable the ability to drop anything onto this node
                'NewNode.DroppingEnabled = False
                _Tree.Nodes.Add(NewNode)
                If TreeNodes.Count > 0 Then
                    If RootNode.NodeId = TreeNodes(0).ParentId Then
                        NewNode.Expanded = True
                        If RootNode.NodeId <> SelectedNodeID Then
                            TreeNodes.RemoveAt(0)
                            BuildHierarchy(NewNode, RootNode.NodeId, TreeNodes, SelectedNodeID)
                        Else
                            'we found the selected node...get this node's direct children so user doesn't have to expand folder so
                            'see what's in it
                            BuildHierarchy(NewNode, RootNode.NodeId)
                            _Tree.SelectedNode = NewNode
                            NewNode.Expanded = True
                        End If
                    End If
                End If
            Next
        End Sub

        Public Sub ExpandTreePathToNode(ByVal RootNodeID As Integer, ByVal SelectedNodeID As Integer)

            If RootNodeID < 1 Or SelectedNodeID < 1 Then
                Return
            End If

            Dim NewNode As TreeViewNode

            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetRootNodes

            'determine the path to the node that should be expanded
            Dim TreeNodes As EntityCollection(Of TreeEntity) = _TreeManager.TreeAncestorList(SelectedNodeID)

            For Each RootNode As NodeItemViewEntity In Nodes
                If RootNode.NodeId = TreeNodes(0).ParentId Then
                    Dim NodeIDString As String = NodeInfo.MakeNodeID(RootNode.NodeId, 2)
                    NewNode = _Tree.FindNodeById(NodeIDString)
                    If Not IsNothing(NewNode) Then
                        NewNode.Expanded = True
                        If RootNode.NodeId <> RootNodeID Then
                            TreeNodes.RemoveAt(0)
                            BuildHierarchy(NewNode, RootNode.NodeId, TreeNodes, SelectedNodeID)
                        Else
                            'we found the selected node...get this node's direct children so user doesn't have to expand folder so
                            'see what's in it
                            BuildHierarchy(NewNode, RootNode.NodeId)
                            _Tree.SelectedNode = NewNode
                            NewNode.Expanded = True
                        End If
                    End If
                End If
            Next
        End Sub

        Public Sub ExpandTreePathToNode(ByVal NodeID As Integer)

            If NodeID < 1 Then
                Return
            End If

            Dim NewNode As TreeViewNode

            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetRootNodes

            'determine the path to the node that should be expanded
            Dim TreeNodes As EntityCollection(Of TreeEntity) = _TreeManager.TreeAncestorList(NodeID)

            For Each RootNode As NodeItemViewEntity In Nodes
                If RootNode.NodeId = TreeNodes(0).ParentId Then
                    Dim NodeIDString As String = NodeInfo.MakeNodeID(RootNode.NodeId, 2)
                    NewNode = _Tree.FindNodeById(NodeIDString)
                    If Not IsNothing(NewNode) Then
                        NewNode.Expanded = True
                        If RootNode.NodeId <> NodeID Then
                            TreeNodes.RemoveAt(0)
                            BuildHierarchy(NewNode, RootNode.NodeId, TreeNodes, NodeID)
                        Else
                            'we found the selected node...get this node's direct children so user doesn't have to expand folder so
                            'see what's in it
                            BuildHierarchy(NewNode, RootNode.NodeId)
                            _Tree.SelectedNode = NewNode
                            NewNode.Expanded = True
                        End If
                    End If
                End If
            Next
        End Sub

        Private Sub BuildHierarchy(ByVal CurrentParent As TreeViewNode, ByVal NodeID As Integer, ByVal TreeNodes As EntityCollection(Of TreeEntity), ByVal SelectedNodeID As Integer)

            Dim NewNode As TreeViewNode

            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetNodeChildren(NodeID)
            For Each Node As NodeItemViewEntity In Nodes
                If _Mode = AdminView.Item And Node.NodeTypeId = 3 Then
                    Continue For
                End If
                If _Mode = AdminView.ItemAccessory And Node.NodeTypeId = 1 Then
                    Continue For
                End If
                NewNode = New TreeViewNode
                NewNode.ImageUrl = Utilities.GetNodeImage(Node)
                NewNode.Text = Utilities.GetNodeText(Node.Name, Node.NodeId, Node.Position)
                NewNode.ID = NodeInfo.MakeNodeID(Node.NodeId, Node.NodeTypeId)
                If Node.NodeTypeId = 2 Then
                    'NewNode.ContentCallbackUrl = "Request.aspx?ID=" & Node.NodeId & "&T=" & Rnd(12)
                    NewNode.ContentCallbackUrl = "Request.aspx?ID=" & Node.NodeId
                Else
                    If Not Node.EditsComplete Then
                        'Items whare aren't complete should appear in bold italic text
                        NewNode.CssClass = "TreeNodeNC"
                        NewNode.HoverCssClass = "HoverTreeNodeNC"
                        NewNode.SelectedCssClass = "SelectedTreeNodeNC"
                    End If
                End If
                'Disable the ability to drop anything onto this node
                'NewNode.DroppingEnabled = False
                CurrentParent.Nodes.Add(NewNode)

                If Node.NodeId = TreeNodes(0).ParentId Then
                    NewNode.Expanded = True
                    If Node.NodeId <> SelectedNodeID Then
                        TreeNodes.RemoveAt(0)
                        BuildHierarchy(NewNode, Node.NodeId, TreeNodes, SelectedNodeID)
                    Else
                        'we found the selected node...get this node's direct children so user doesn't have to expand folder so
                        'see what's in it
                        BuildHierarchy(NewNode, Node.NodeId)
                        _Tree.SelectedNode = NewNode
                        NewNode.Expanded = True
                    End If
                End If
            Next

        End Sub

        Private Sub BuildHierarchy(ByVal CurrentParent As TreeViewNode, ByVal NodeID As Integer)

            Dim TreeManager As New TreeManager()
            Dim NewNode As TreeViewNode

            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = TreeManager.GetNodeChildren(NodeID)
            For Each Node As NodeItemViewEntity In Nodes
                If _Mode = AdminView.Item And Node.NodeTypeId = 3 Then
                    Continue For
                End If
                If _Mode = AdminView.ItemAccessory And Node.NodeTypeId = 1 Then
                    Continue For
                End If
                NewNode = New TreeViewNode
                NewNode.ImageUrl = Utilities.GetNodeImage(Node)
                NewNode.Text = Utilities.GetNodeText(Node.Name, Node.NodeId, Node.Position)
                NewNode.ID = NodeInfo.MakeNodeID(Node.NodeId, Node.NodeTypeId)
                If Node.NodeTypeId = 2 Then
                    'NewNode.ContentCallbackUrl = "Request.aspx?ID=" & Node.NodeId & "&T=" & Rnd(12)
                    NewNode.ContentCallbackUrl = "Request.aspx?ID=" & Node.NodeId
                Else
                    If Not Node.EditsComplete Then
                        'Items whare aren't complete should appear in bold italic text
                        NewNode.CssClass = "TreeNodeNC"
                        NewNode.HoverCssClass = "HoverTreeNodeNC"
                        NewNode.SelectedCssClass = "SelectedTreeNodeNC"
                    End If
                End If
                'Disable the ability to drop anything onto this node
                'NewNode.DroppingEnabled = False
                CurrentParent.Nodes.Add(NewNode)
            Next

        End Sub

    End Class

End Namespace
