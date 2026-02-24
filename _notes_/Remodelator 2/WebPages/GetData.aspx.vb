Imports System.Diagnostics
Imports System.Collections.Generic
Imports System.IO
Imports System.Drawing
Imports System.Drawing.Image

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class GetData
        Inherits System.Web.UI.Page

        Dim _ItemManager As New ItemManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then

                Dim ImageID As String = Request.QueryString("ImgID")
                Dim DocumentID As String = Request.QueryString("DocID")
                Dim DoThumb As String = Request.QueryString("DoThumb")
                Dim ItemID As String = Request.QueryString("ItemID")
                Dim MaxDimension As Integer
                If Not String.IsNullOrEmpty(ImageID) Then
                    Dim Image As ImageEntity = _ItemManager.ImageSelect(CInt(ImageID))
                    If Not IsNothing(Image) Then
                        Dim Data() As Byte = Image.Data
                        If Not String.IsNullOrEmpty(DoThumb) Then
                            MaxDimension = CInt(DoThumb)
                            Data = GetThumbnail(Data, MaxDimension)
                        End If
                        Response.ClearContent()
                        Response.ClearHeaders()
                        Response.ContentType = Image.ContentType
                        Response.BinaryWrite(Data)
                    Else
                        'No image was available
                    End If
                ElseIf Not String.IsNullOrEmpty(DocumentID) Then
                    Dim Document As DocumentEntity = _ItemManager.DocumentSelect(CInt(DocumentID))
                    If Not IsNothing(Document) Then
                        Dim Data() As Byte = Document.Data
                        Response.ClearContent()
                        Response.ClearHeaders()
                        Response.ContentType = Document.ContentType
                        'Response.AddHeader("Content-Disposition", "attachment; filename=" & HttpUtility.UrlEncode(Document.Path, Encoding.UTF8))
                        Response.AddHeader("content-disposition", "inline; filename=""" & Document.Path & """")
                        'Response.AddHeader("Content-Length", Data.Length.ToString())
                        Response.BinaryWrite(Data)
                    Else
                        'No Document was available
                    End If
                ElseIf Not String.IsNullOrEmpty(ItemID) Then
                    Dim Image As ImageEntity = _ItemManager.ImageSelectByItem(CInt(ItemID))
                    If Not IsNothing(Image) Then
                        Dim Data() As Byte = Image.Data
                        If Not String.IsNullOrEmpty(DoThumb) Then
                            MaxDimension = CInt(DoThumb)
                            Data = GetThumbnail(Data, MaxDimension)
                        End If
                        Response.ClearContent()
                        Response.ClearHeaders()
                        Response.ContentType = Image.ContentType
                        Response.BinaryWrite(Data)
                        Response.Flush()
                    Else
                        'No image was available
                    End If
                Else
                    'do nothing
                End If


                Response.Flush()
                Response.End()
            End If
        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Function GetThumbnail(ByVal Data() As Byte, Optional ByVal MaxDimension As Integer = 100) As Byte()
            'Return Data

            Dim mstream As New System.IO.MemoryStream(Data, 0, Data.Length)
            Dim dbImage As Image = Image.FromStream(New MemoryStream(Data))

            Dim Width As Integer = dbImage.Width
            Dim Height As Integer = dbImage.Height
            Dim NewWidth As Integer
            Dim NewHeight As Integer
            Dim Factor As Double = 1

            If Width > Height Then
                If Width > MaxDimension Then
                    Factor = Width / MaxDimension
                End If
            Else
                If Height > MaxDimension Then
                    Factor = Height / MaxDimension
                End If
            End If

            NewWidth = Width / Factor
            NewHeight = Height / Factor

            'get the horizontal and vertical sizes. Find the largest size and get it down to 100. then We need to get horizontal down to 
            Dim dummyCallBack As New System.Drawing.Image.GetThumbnailImageAbort(AddressOf ThumbnailCallback)
            Dim thumbnailImage As Image = dbImage.GetThumbnailImage(NewWidth, NewHeight, dummyCallBack, New System.IntPtr())

            thumbnailImage.Save(mstream, dbImage.RawFormat)
            Dim thumbnailByteArray(mstream.Length) As Byte

            mstream.Position = 0
            mstream.Read(thumbnailByteArray, 0, Convert.ToInt32(mstream.Length))
            mstream.Close()
            mstream.Dispose()

            Return thumbnailByteArray

        End Function

        Function ThumbnailCallback() As Boolean
            Return False
        End Function

#End Region

    End Class

End Namespace
