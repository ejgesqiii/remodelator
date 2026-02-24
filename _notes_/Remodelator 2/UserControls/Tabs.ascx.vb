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

    Partial Class Tabs
        Inherits ControlBase

        Dim _BaseClassManager As New BaseClassManager()
        Dim _TreeManager As New TreeManager()

        Dim _Tree As TreeView
        Const TREE_CONTROL_NAME As String = "tvItems"
        Const PRODUCT_IMAGE_PATH As String = "../Images/Products/"
        Const PDF_PATH As String = "../PDFs/"

#Region "Public Properties"

        Public ReadOnly Property MainMenu() As Menu
            Get
                Return Menu1
            End Get
        End Property
#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            Dim RootNodeIds As New List(Of Integer)
            Dim ChildNodes As EntityCollection(Of NodeItemViewEntity)

            If Not Page.IsPostBack Then
                Dim Tabs As EntityCollection(Of TabEntity) = _BaseClassManager.TabList(Nothing)
                For Each Tab As TabEntity In Tabs
                    If Tab.NodeId.HasValue Then
                        RootNodeIds.Add(Tab.NodeId.GetValueOrDefault())
                    End If
                Next
                'Dim Nodes As EntityCollection(Of NodeEntity) = _TreeManager.GetNodeChildren(RootNodeIds)
                For Each Tab As TabEntity In Tabs
                    If Tab.Name.ToLower() = "admin" Then
                        If Not IsAuthenticated Then
                            Continue For
                        ElseIf IsNothing(Subscriber) OrElse Not Subscriber.IsAdmin Then
                            Continue For
                        End If
                    End If
                    If Tab.Name.ToLower() = "audit" Then
                        If Not IsAuthenticated Then
                            Continue For
                        ElseIf IsNothing(Subscriber) OrElse Not Subscriber.IsSuperAdmin Then
                            Continue For
                        End If
                    End If
                    Dim MenuItem As New MenuItem
                    MenuItem.Text = Tab.Name
                    MenuItem.Value = Tab.TabId.ToString()
                    If Tab.NodeId.HasValue Then
                        MenuItem.NavigateUrl = Tab.NavigateUrl & ".aspx?NodeID=" & Tab.NodeId.GetValueOrDefault()
                    Else
                        MenuItem.NavigateUrl = Tab.NavigateUrl & ".aspx"
                    End If

                    Menu1.Items.Add(MenuItem)

                    'TODO: Somewhat expensive to retrieve each set of children in this manner
                    If IsAuthenticated Then
                        'Get the children of this node
                        ChildNodes = _TreeManager.GetNodeChildren(Tab.NodeId.GetValueOrDefault())
                        For Each ChildNode As NodeItemViewEntity In ChildNodes
                            Dim ChildMenuItem As New MenuItem
                            ChildMenuItem.Text = ChildNode.Name
                            ChildMenuItem.Value = ChildNode.NodeId.ToString()
                            ChildMenuItem.NavigateUrl = Tab.NavigateUrl & ".aspx?NodeID=" & ChildNode.NodeId
                            MenuItem.Items.Add(ChildMenuItem)
                        Next
                    End If
                Next

            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            If IsNothing(Menu1.SelectedItem) Then
                If Menu1.Items.Count > 0 Then
                    Menu1.SelectedItem = Menu1.Items(0)
                End If
            End If
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
