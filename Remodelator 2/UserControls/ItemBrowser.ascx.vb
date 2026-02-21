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

    Partial Class ItemBrowser
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()
        Dim _OrderManager As New OrderManager()

#Region "Public Properties"

        Public Property LineID() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("LineID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("LineID") = value
            End Set
        End Property

        Public Property RootNodeID() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("RootNodeID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("RootNodeID") = value
            End Set
        End Property

        Public Property SelectedMenuItemNodeID() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("SelectedMenuItemNodeID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("SelectedMenuItemNodeID") = value
            End Set
        End Property

        Public Property PreviousFolderNodeID() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("PreviousFolderNodeID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("PreviousFolderNodeID") = value
            End Set
        End Property

        Public Property NextFolderNodeID() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("NextFolderNodeID")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("NextFolderNodeID") = value
            End Set
        End Property

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then
                
            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            SetVisibility()
            Mode = AdminView.Item

            If Not Page.IsPostBack Then
                If IsAuthenticated Then
                    SetTreeParameters(tvItems)
                    Dim TreeHelper As New TreeHelper(Mode, tvItems)

                    PreviousFolderNodeID = _TreeManager.PreviousSibling(RootNodeID.GetValueOrDefault())     'hit db
                    NextFolderNodeID = _TreeManager.NextSibling(RootNodeID.GetValueOrDefault())             'hit db
                    If Not IsNothing(LineID) Then
                        'coming here from a 'View' link on the Estimate grid page
                        OrderItemDetail = _OrderManager.OrderItemDetailViewSelect(CInt(LineID))             'hit db
                        If Not IsNothing(OrderItemDetail) Then
                            SelectedMenuItemNodeID = OrderItemDetail.NodeId
                        End If
                    Else
                        OrderItemDetail = Nothing
                        If Not String.IsNullOrEmpty(Request.QueryString("SelectedNodeID")) Then
                            'coming here from the 'Return To Selections' link on the Estimate grid page
                            SelectedMenuItemNodeID = CInt(Request.QueryString("SelectedNodeID"))
                        Else
                            'coming here from clicking tabs to browse items
                            SelectedMenuItemNodeID = RootNodeID
                        End If
                    End If

                    'TODO: This function only works if:
                    '1) RootNodeID=SelectedMenuItemNodeID
                    '2) RootNodeID=SelectedMenuItemNodeID and RootNode is a root tree node (i.e. 'Bathroom Remodeling'). 
                    TreeHelper.BuildTree(RootNodeID, SelectedMenuItemNodeID)

                    
                    Dim Tab As TabEntity = Nothing
                    Dim Node As NodeItemViewEntity = Nothing
                    If Not IsNothing(PreviousFolderNodeID) Then
                        Node = _TreeManager.NodeSelect(PreviousFolderNodeID.GetValueOrDefault())
                        If IsNothing(Node.ParentId) Then
                            Tab = New BaseClassManager().TabSelectByNodeID(Node.NodeId)
                        Else
                            Tab = New BaseClassManager().TabSelectByNodeID(Node.ParentId.GetValueOrDefault())
                        End If
                        PreviousFolder.Text = String.Format("<a class=""NavLink"" href='{0}.aspx?NodeID={1}'>{2}</a>", _
                            Tab.NavigateUrl, _
                            PreviousFolderNodeID.GetValueOrDefault(), _
                            "<- " & Node.Name) & "<br/>"
                    End If
                    If Not IsNothing(NextFolderNodeID) Then
                        Node = _TreeManager.NodeSelect(NextFolderNodeID.GetValueOrDefault())
                        If IsNothing(Node.ParentId) Then
                            Tab = New BaseClassManager().TabSelectByNodeID(Node.NodeId)
                        Else
                            Tab = New BaseClassManager().TabSelectByNodeID(Node.ParentId.GetValueOrDefault())
                        End If
                        If Not IsNothing(Tab) Then
                            NextFolder.Text = String.Format("<a class=""NavLink"" href='{0}.aspx?NodeID={1}'>{2}</a>", _
                                Tab.NavigateUrl, _
                                NextFolderNodeID.GetValueOrDefault(), _
                                "-> " & Node.Name) & ""
                        End If
                    End If

                    're-select the last selected node
                    Dim NodeId As String = Request.QueryString("NodeId")
                    If Not String.IsNullOrEmpty(NodeId) Then
                        NodeSelected(tvItems.SelectedNode)
                    End If
                End If
            End If

        End Sub

#End Region

#Region "Control Events"

        Protected Sub tvItems_NodeSelected(ByVal sender As Object, ByVal e As ComponentArt.Web.UI.TreeViewNodeEventArgs) Handles tvItems.NodeSelected
            NodeSelected(e.Node)
            'clear the OrderItem session variable since user explicitly selected a node
            OrderItemDetail = Nothing
        End Sub

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub SetVisibility()

        End Sub

        Public Sub SetTreeParameters(ByVal Tree As TreeView)

            Tree.ExpandNodeOnSelect = False
            Tree.AutoPostBackOnNodeMove = True
            Tree.MultipleSelectEnabled = False
            Tree.DragAndDropEnabled = False
            Tree.KeyboardEnabled = False
            Tree.NodeEditingEnabled = False
            Tree.KeyboardCutCopyPasteEnabled = False
            Tree.ShowLines = True
            Tree.DisplayMargin = False
            Tree.ExpandSinglePath = True

        End Sub

        Private Sub NodeSelected(ByVal Node As TreeViewNode)
            'refresh the Item Select control pane to load the details for the selected node

            Dim NodeData As NodeInfo = New NodeInfo(Node)
            ucItemSelect.NodeTypeId = NodeData.NodeTypeID
            ucItemSelect.NodeId = NodeData.NodeID
            ucItemSelect.Reload = True
            ucItemSelect.EditMode = PageMode.Add
            LastItemSelectionNodeID = NodeData.NodeID
        End Sub

#End Region

    End Class

End Namespace
