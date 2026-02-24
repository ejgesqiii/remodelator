Imports System.Collections.Generic

Imports Microsoft.VisualBasic

Namespace Remodelator


    Public Class OrderDetail
        Private _LineID As Integer
        Private _Name, _Comment As String
        Private _Price As Decimal

        Public Property LineID() As Integer
            Get
                Return _LineID
            End Get
            Set(ByVal value As Integer)
                _LineID = value
            End Set
        End Property
        Public Property Name() As String
            Get
                Return _Name
            End Get
            Set(ByVal value As String)
                _Name = value
            End Set
        End Property
        Public Property Price() As Decimal
            Get
                Return _Price
            End Get
            Set(ByVal value As Decimal)
                _Price = value
            End Set
        End Property
        Public Property Comment() As String
            Get
                Return _Comment
            End Get
            Set(ByVal value As String)
                _Comment = value
            End Set
        End Property

        Public Sub New()

        End Sub

        Public Sub New(ByVal LineId As Integer, ByVal Name As String, ByVal Price As String, ByVal Comment As String)
            Me.LineID = LineId
            Me.Name = Name
            Me.Price = Price
            Me.Comment = Comment
        End Sub

    End Class

End Namespace
