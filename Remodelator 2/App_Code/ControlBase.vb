Option Strict On

Imports RemodelatorBLL
Imports RemodelatorDAL
Imports RemodelatorDAL.EntityClasses

Namespace Remodelator

    Public Class ControlBase
        Inherits System.Web.UI.UserControl


#Region "Public Properties"

        Public ReadOnly Property TheSession() As SessionVals
            Get
                Return ParentPage.TheSession
            End Get
        End Property

        ''' <summary>
        ''' Helper to return strongly typed PageBase parent
        ''' </summary>
        ''' <value></value>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public ReadOnly Property ParentPage() As PageBase
            Get
                Return CType(Me.Page, PageBase)
            End Get
        End Property

        Public Property Mode() As AdminView
            Get
                Dim o As Object = Session("Mode")
                If IsNothing(o) Then
                    Return AdminView.Item
                Else
                    Return CType(o, AdminView)
                End If
            End Get
            Set(ByVal value As AdminView)
                Session("Mode") = value
            End Set
        End Property

        Public Property Subscriber() As SubscriberEntity
            Get
                Return ParentPage.Subscriber
            End Get
            Set(ByVal value As SubscriberEntity)
                ParentPage.Subscriber = value
            End Set
        End Property

        Public ReadOnly Property Estimate() As OrderEntity
            Get
                Return ParentPage.Estimate
            End Get
        End Property

        Public Property OrderItemDetail() As OrderItemDetailViewEntity
            Get
                Return ParentPage.OrderItemDetail
            End Get
            Set(ByVal value As OrderItemDetailViewEntity)
                ParentPage.OrderItemDetail = value
            End Set
        End Property

        Public Property LastItemSelectionNodeID() As Integer
            Get
                Return ParentPage.LastItemSelectionNodeID
            End Get
            Set(ByVal value As Integer)
                ParentPage.LastItemSelectionNodeID = value
            End Set
        End Property

        Public Property SelectedItemConfigNodeId() As Nullable(Of Integer)
            Get
                Return ParentPage.SelectedItemConfigNodeId
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ParentPage.SelectedItemConfigNodeId = value
            End Set
        End Property

        Public Property SelectedAccessoryConfigNodeId() As Nullable(Of Integer)
            Get
                Return ParentPage.SelectedAccessoryConfigNodeId
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ParentPage.SelectedAccessoryConfigNodeId = value
            End Set
        End Property

        Public ReadOnly Property IsAuthenticated() As Boolean
            Get
                Return Page.User.Identity.IsAuthenticated
            End Get
        End Property

        Public Property ControlMode() As PageMode
            Get
                Dim o As Object = ViewState("ControlMode")
                If IsNothing(o) Then
                    Return PageMode.View
                Else
                    Return CType(o, PageMode)
                End If
            End Get
            Set(ByVal value As PageMode)
                ViewState("ControlMode") = value
            End Set
        End Property

#End Region

        Public Function ConvertToAbsoluteUrl(ByVal relativeUrl As String, Optional ByVal ForceSecure As Boolean = False) As String
            Return Utilities.ConvertToAbsoluteUrl(relativeUrl, Request, Page, ForceSecure)
        End Function

    End Class


End Namespace