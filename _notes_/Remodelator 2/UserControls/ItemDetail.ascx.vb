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

    Partial Class ItemDetail
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()
        Dim _ItemManager As New ItemManager()

#Region "Public Properties"

        Property ItemID() As Integer
            Get
                Dim o As Object = ViewState("ItemID")
                If IsNothing(o) Then
                    Return -1
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("ItemID") = value
            End Set
        End Property

        Property NodeId() As Integer
            Get
                Dim o As Object = ViewState("NodeId")
                If IsNothing(o) Then
                    Return -1
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("NodeId") = value
            End Set
        End Property

        Property NodeTypeId() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("NodeTypeId")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("NodeTypeId") = value
            End Set
        End Property

        Property Reload() As Boolean
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

        ReadOnly Property CurrentNodeType() As NodeType
            Get
                Return Utilities.GetNodeType(NodeTypeId)
            End Get
        End Property

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            SetVisibility()

            If Reload Then
                LoadData(NodeId)
                Reload = False
            End If

        End Sub

#End Region

#Region "Control Events"


#End Region

#Region "Public Helpers"

        Public Function GetPrice(ByVal ItemID As Integer) As String
            'if adding a new item, using estimate markups
            'if there's not an active estimate, use subcontractor markups
            Dim Item As ItemEntity = _ItemManager.ItemSelect(ItemID)
            Return Format(_ItemManager.ItemPrice(Item.Price, Item.PlumberProdRate, Item.TinnerProdRate, Item.ElectricianProdRate, Item.DesignerProdRate, _
                Item.RemodelerProdRate, Subscriber, Estimate), "$0.00")
        End Function

#End Region

#Region "Private Helpers"

        Private Sub LoadData(ByVal NodeId As Integer)

            Dim Item As NodeItemViewEntity = _TreeManager.NodeSelect(NodeId)

            If Not IsNothing(Item) Then
                ItemID = Item.ItemId
                Title.Text = Item.Name

                'Get a list of all images that are associated with this item
                Dim Images As EntityCollection(Of ImageEntity) = _ItemManager.ImageList(Item.ItemId)

                MainImage.Visible = False
                SecondImage.Visible = False
                Thumb1.Visible = False
                Thumb2.Visible = False
                Thumb3.Visible = False
                Thumb4.Visible = False

                Dim LargeImageViewCommand As String = "window.open('GetData.aspx?ImgID={0}','ImgL','toolbar=no,locations=no,directories=no,status=no,menubar=no,width=500,height=500');"
                For I As Integer = 5 To 0 Step -1
                    Try
                        Dim image As ImageEntity = Images(I)
                        Select Case I
                            Case 5
                                Thumb4.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb4.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=50"
                                Thumb4.Visible = True
                            Case 4
                                Thumb3.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb3.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=50"
                                Thumb3.Visible = True
                            Case 3
                                Thumb2.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb2.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=50"
                                Thumb2.Visible = True
                            Case 2
                                Thumb1.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb1.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=50"
                                Thumb1.Visible = True
                            Case 1
                                SecondImage.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                SecondImage.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=100"
                                SecondImage.Visible = True
                            Case 0
                                MainImage.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                MainImage.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=100"
                                MainImage.Visible = True
                        End Select
                    Catch ex As Exception

                    End Try
                Next

                Price.Text = GetPrice(ItemID)

                'Get a list of all item bullets that are associated with this item
                Dim Bullets As EntityCollection(Of ItemBulletEntity) = _ItemManager.ItemBulletList(Item.ItemId)
                Dim BulletItem As New ListItem
                ItemBullets.Items.Clear()
                For Each Bullet As ItemBulletEntity In Bullets
                    If Not String.IsNullOrEmpty(Bullet.BulletText) Then
                        BulletItem = New ListItem
                        BulletItem.Text = Bullet.BulletText
                        ItemBullets.Items.Add(BulletItem)
                    End If
                Next


            End If
        End Sub

        Private Sub SetVisibility()

            UpdateControlMode(False)

        End Sub

        Private Sub UpdateControlMode(ByVal isReadOnly As Boolean)

        End Sub

#End Region

    End Class

End Namespace
