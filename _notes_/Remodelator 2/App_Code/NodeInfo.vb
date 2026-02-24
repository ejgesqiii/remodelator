Option Strict On

Imports Microsoft.VisualBasic
Imports System.Collections.Generic
Imports System.Diagnostics
Imports System.IO

Imports RemodelatorBLL
Imports RemodelatorDAL
Imports RemodelatorDAL.EntityClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Public Class NodeInfo
        Private _Name As String = Nothing
        Private _NodeID As Integer
        Private _NodeTypeID As Integer
        Private _NodeType As NodeType
        Private Const Separator As String = "!_"

        Property Name() As String
            Get
                Return _Name
            End Get
            Set(ByVal value As String)
                _Name = value
            End Set
        End Property

        Property NodeID() As Integer
            Get
                Return _NodeID
            End Get
            Set(ByVal value As Integer)
                _NodeID = value
            End Set
        End Property

        Property NodeTypeID() As Integer
            Get
                Return _NodeTypeID
            End Get
            Set(ByVal value As Integer)
                _NodeTypeID = value
            End Set
        End Property

        Property NodeType() As NodeType
            Get
                Return _NodeType
            End Get
            Set(ByVal value As NodeType)
                _NodeType = value
            End Set
        End Property

        Public Sub New()
        End Sub

        Public Sub New(ByVal Name As String, ByVal NodeID As Integer, ByVal NodeTypeID As Integer)
            Me.Name = Name
            Me.NodeID = NodeID
            Me.NodeTypeID = NodeTypeID
            Me.NodeType = Utilities.GetNodeType(NodeTypeID)
        End Sub

        Public Sub New(ByVal Node As TreeViewNode)
            If Not IsNothing(Node) Then
                Me.Name = Node.Text.Substring(0, Node.Text.LastIndexOf("("))

                Dim Data As String() = Regex.Split(Node.ID, Separator)
                Me.NodeID = CInt(Data(0))
                Me.NodeTypeID = CInt(Data(1))
                Me.NodeType = Utilities.GetNodeType(NodeTypeID)
            Else
                Me.Name = Nothing
                Me.NodeID = -1
                Me.NodeTypeID = -1
                Me.NodeType = Remodelator.NodeType.None
            End If
        End Sub

        Public Sub New(ByVal Node As TreeNode)
            If Not IsNothing(Node) Then
                Me.Name = Node.Text.Substring(0, Node.Text.LastIndexOf("("))

                Dim Data As String() = Regex.Split(Node.Value, Separator)
                Me.NodeID = CInt(Data(0))
                Me.NodeTypeID = CInt(Data(1))
                Me.NodeType = Utilities.GetNodeType(NodeTypeID)
            Else
                Me.Name = Nothing
                Me.NodeID = -1
                Me.NodeTypeID = -1
                Me.NodeType = Remodelator.NodeType.None
            End If
        End Sub

        Public Shared Function MakeNodeID(ByVal NodeID As Integer, ByVal NodeTypeID As Integer) As String
            Return NodeID & Separator & NodeTypeID
        End Function

    End Class

End Namespace

