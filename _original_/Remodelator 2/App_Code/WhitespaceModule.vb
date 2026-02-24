#Region "Using"

Imports System
Imports System.IO
Imports System.Web
Imports System.IO.Compression
Imports System.Text.RegularExpressions

#End Region

Public Class WhitespaceModule
    Implements IHttpModule

#Region "IHttpModule Members"

    Public Sub Dispose() Implements System.Web.IHttpModule.Dispose

    End Sub

    Public Sub Init(ByVal context As System.Web.HttpApplication) Implements System.Web.IHttpModule.Init
        AddHandler context.BeginRequest, AddressOf context_BeginRequest
    End Sub

    Private Sub context_BeginRequest(ByVal sender As Object, ByVal e As EventArgs)
        Dim app As HttpApplication = CType(sender, HttpApplication)
        If app.Request.RawUrl.Contains(".aspx") Then
            app.Response.Filter = New WhitespaceFilter(app.Response.Filter)
        End If
    End Sub

#End Region

#Region "Stream filter"

    Private Class WhitespaceFilter
        Inherits Stream

        Public Sub New(ByVal sink As Stream)
            _sink = sink
        End Sub

        Private _sink As Stream
        'Private Shared reg As Regex = New Regex("(?<=[^])\t{2,}|(?<=[>])\s{2,}(?=[<])|(?<=[>])\s{2,11}(?=[<])|(?=[\n])\s{2,}")
        Private Shared reg As Regex = New Regex("( ){2,}|\t+")
        'Private Shared reg As Regex = New Regex("(\t\r\n)+")

#Region "Properites"

        Public Overrides ReadOnly Property CanRead() As Boolean
            Get
                Return True
            End Get
        End Property

        Public Overrides ReadOnly Property CanSeek() As Boolean
            Get
                Return True
            End Get
        End Property

        Public Overrides ReadOnly Property CanWrite() As Boolean
            Get
                Return True
            End Get
        End Property

        Public Overrides Sub Flush()
            _sink.Flush()
        End Sub

        Public Overrides ReadOnly Property Length() As Long
            Get
                Return 0
            End Get
        End Property

        Private _position As Long
        Public Overrides Property Position() As Long
            Get
                Return _position
            End Get
            Set(ByVal Value As Long)
                _position = Value
            End Set
        End Property

#End Region

#Region "Methods"
        Public Overrides Function Read(ByVal buffer() As Byte, ByVal offset As Integer, ByVal count As Integer) As Integer
            Return _sink.Read(buffer, offset, count)
        End Function

        Public Overrides Function Seek(ByVal offset As Long, ByVal origin As SeekOrigin) As Long
            Return _sink.Seek(offset, origin)
        End Function

        Public Overrides Sub SetLength(ByVal value As Long)
            _sink.SetLength(value)
        End Sub

        Public Overrides Sub Close()
            _sink.Close()
        End Sub

        Public Overrides Sub Write(ByVal bufferData() As Byte, ByVal offset As Integer, ByVal count As Integer)
            Dim data(count) As Byte
            Buffer.BlockCopy(bufferData, offset, data, 0, count)
            Dim html As String = System.Text.Encoding.Default.GetString(bufferData)

            html = reg.Replace(html, " ")

            Dim outdata() As Byte = System.Text.Encoding.Default.GetBytes(html)
            _sink.Write(outdata, 0, outdata.GetLength(0))
        End Sub

#End Region

    End Class


#End Region

End Class
