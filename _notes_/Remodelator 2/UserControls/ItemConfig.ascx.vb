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

    Partial Class ItemConfig
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()

#Region "Public Properties"

        Public Property Reload() As Boolean
            Get
                Dim o As Object = ViewState("Reload")
                If IsNothing(o) Then
                    Return False
                Else
                    Return CBool(o)
                End If
            End Get
            Set(ByVal value As Boolean)
                ViewState("Reload") = value
            End Set
        End Property

        Public ReadOnly Property FolderNodeTypeID() As Integer
            Get
                If Mode = AdminView.Item Then
                    Return 2
                ElseIf Mode = AdminView.ItemAccessory Then
                    Return 4
                Else
                    'Not valid
                    Return 0
                End If
            End Get
        End Property

        Public ReadOnly Property ItemNodeTypeID() As Integer
            Get
                If Mode = AdminView.Item Then
                    Return 1
                ElseIf Mode = AdminView.ItemAccessory Then
                    Return 3
                Else
                    'Not valid
                    Return 0
                End If
            End Get
        End Property
#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            Dim SelectedNodeID As Nullable(Of Integer)

            If Not Page.IsPostBack Or Reload Then
                SetTreeParameters(tvItems2)
                If Mode = AdminView.Item Then
                    SelectedNodeID = SelectedItemConfigNodeId
                Else
                    SelectedNodeID = SelectedAccessoryConfigNodeId
                End If
                Dim TreeHelper As New TreeHelper(Mode, tvItems2)
                TreeHelper.BuildTopLevelTree(SelectedNodeID.GetValueOrDefault())
                If Not IsNothing(SelectedNodeID) Then
                    Dim Node As TreeViewNode = tvItems2.SelectedNode
                    Dim NodeData As NodeInfo = New NodeInfo(Node)
                    IAE.NodeTypeId = NodeData.NodeTypeID
                    If Mode = AdminView.ItemAccessory And NodeData.NodeTypeID = 2 Then
                        IAE.Action = PageAction.View
                    Else
                        IAE.Action = PageAction.Update
                    End If
                    IAE.NodeId = NodeData.NodeID
                    IAE.Reload = True
                Else
                    IAE.Reset()
                End If
                'IAE.Reset()
                Reload = False
            End If

            SetVisibility()
        End Sub

#End Region

#Region "Control Events"

        Protected Sub lnkNewFolder_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles lnkNewFolder.Click
            Dim NodeInfo As NodeInfo
            IAE.NodeTypeId = FolderNodeTypeID
            IAE.NodeId = Nothing
            If Not IsNothing(tvItems2.SelectedNode) Then
                NodeInfo = New NodeInfo(tvItems2.SelectedNode)
                IAE.ParentNodeId = NodeInfo.NodeID
            Else
                IAE.ParentNodeId = Nothing
            End If

            IAE.Action = PageAction.Add
            IAE.Reload = True
        End Sub

        Protected Sub lnkNewItem_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles lnkNewItem.Click
            Dim NodeInfo As NodeInfo
            IAE.NodeTypeId = ItemNodeTypeID
            IAE.NodeId = Nothing
            If Not IsNothing(tvItems2.SelectedNode) Then
                NodeInfo = New NodeInfo(tvItems2.SelectedNode)
                IAE.ParentNodeId = NodeInfo.NodeID
            Else
                IAE.ParentNodeId = Nothing
            End If

            IAE.Action = PageAction.Add
            IAE.Reload = True
        End Sub

        Protected Sub lnkCopyItem_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles lnkCopyItem.Click
            If Not IsNothing(tvItems2.SelectedNode) Then
                Dim NodeData As NodeInfo = New NodeInfo(tvItems2.SelectedNode)
                IAE.NodeId = NodeData.NodeID
                IAE.NodeTypeId = NodeData.NodeTypeID
                IAE.Action = PageAction.Copy
                IAE.Reload = True
            Else
                'do nothing
            End If
        End Sub

        Protected Sub tvItems_NodeMoved(ByVal sender As Object, ByVal e As ComponentArt.Web.UI.TreeViewNodeMovedEventArgs) Handles tvItems2.NodeMoved
            Dim NodeMoved As TreeViewNode = e.Node
            Dim NodeMovedData As NodeInfo = New NodeInfo(NodeMoved)
            Dim NewParentNode As TreeViewNode = e.Node.ParentNode
            Dim NewParentID As Nullable(Of Integer) = Nothing
            If Not IsNothing(NewParentNode) Then
                Dim ParentNodeData As NodeInfo = New NodeInfo(NewParentNode)
                NewParentID = ParentNodeData.NodeID
            End If

            'Update move in database 
            _TreeManager.NodeMove(NewParentID, 0, NodeMovedData.NodeID)
            tvItems2.SelectedNode = NodeMoved

            IAE.NodeTypeId = NodeMovedData.NodeTypeID
            IAE.Action = PageAction.Update
            IAE.NodeId = NodeMovedData.NodeID
            IAE.Reload = True
        End Sub

        Protected Sub tvItems_NodeSelected(ByVal sender As Object, ByVal e As ComponentArt.Web.UI.TreeViewNodeEventArgs) Handles tvItems2.NodeSelected
            Dim Node As TreeViewNode = e.Node
            Dim NodeData As NodeInfo = New NodeInfo(Node)
            IAE.NodeTypeId = NodeData.NodeTypeID
            If Mode = AdminView.ItemAccessory And NodeData.NodeTypeID = 2 Then
                'don't allow modification of folders on Accessory Config page
                IAE.Action = PageAction.View
            Else
                IAE.Action = PageAction.Update
            End If
            IAE.NodeId = NodeData.NodeID
            IAE.Reload = True

            If Mode = AdminView.Item Then
                SelectedItemConfigNodeId = NodeData.NodeID
                If NodeData.NodeType = NodeType.Folder Then
                    'select the same node on the accessory config page
                    SelectedAccessoryConfigNodeId = NodeData.NodeID
                ElseIf NodeData.NodeType = NodeType.Item Then
                    'select the parent node
                    SelectedAccessoryConfigNodeId = _TreeManager.GetParentNodeID(NodeData.NodeID)
                End If
            Else
                'capture new selection in case user navigates away from Admin menu and then back
                SelectedAccessoryConfigNodeId = NodeData.NodeID
            End If

        End Sub


#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub SetVisibility()
            Dim SelectedNode As TreeViewNode = tvItems2.SelectedNode
            If Not IsNothing(SelectedNode) Then
                Dim NodeData As NodeInfo = New NodeInfo(SelectedNode)

                'only allow node creation when an item is not selected
                lnkNewFolder.Visible = (NodeData.NodeTypeID = 2 And Mode = AdminView.Item)
                lnkNewItem.Visible = (NodeData.NodeTypeID = 2 And Not IsNothing(SelectedNode.ParentNode))
                lnkCopyItem.Visible = (NodeData.NodeTypeID <> 2 And Mode = AdminView.Item)

                lnkNewItem.Text = CStr(IIf(Mode = AdminView.Item, "Create New Item", "Create New Accessory"))
            Else
                lnkNewFolder.Visible = True
                lnkNewItem.Visible = False
                lnkCopyItem.Visible = False
            End If
            Spacer1.Visible = lnkNewFolder.Visible
            Spacer2.Visible = lnkNewItem.Visible
        End Sub

        Public Sub SetTreeParameters(ByVal Tree As TreeView)

            Tree.ExpandNodeOnSelect = False
            Tree.AutoPostBackOnNodeMove = True
            Tree.MultipleSelectEnabled = False
            Tree.DragAndDropEnabled = True
            Tree.KeyboardEnabled = False
            Tree.NodeEditingEnabled = False
            Tree.KeyboardCutCopyPasteEnabled = False
            Tree.ShowLines = True
            Tree.DisplayMargin = False
            Tree.ExpandSinglePath = False

        End Sub

#End Region

    End Class

End Namespace
