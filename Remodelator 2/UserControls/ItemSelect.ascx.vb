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

    Partial Class ItemSelect
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()
        Dim _ItemManager As New ItemManager()
        Dim _OrderManager As New OrderManager()

        Dim _Tree As TreeView
        Const TREE_CONTROL_NAME As String = "tvItems"
        Dim _OrderItemAccessories As New EntityCollection(Of OrderItemDetailViewEntity)(New OrderItemDetailViewEntityFactory())

#Region "Public Properties"

        Property EditMode() As PageMode
            Get
                Dim o As Object = ViewState("EditMode")
                If IsNothing(o) Then
                    Return PageMode.Add
                Else
                    Return CType(o, PageMode)
                End If
            End Get
            Set(ByVal value As PageMode)
                ViewState("EditMode") = value
            End Set
        End Property

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

            ErrorPanel.Visible = False
            MessagePanel.Visible = False
            DuplicateItem.Visible = False

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            SetVisibility()

            If NodeTypeId.GetValueOrDefault() <> 1 Then
                PleaseSelectDiv.Visible = True
                ItemInfoDiv.Visible = False
            Else
                PleaseSelectDiv.Visible = False
                ItemInfoDiv.Visible = True
            End If

            If Reload Then
                LoadData(NodeId)
                Reload = False
            End If

            If EditMode = PageMode.Add Then
                MessagePanel.InnerHtml = "The item has been added to your estimate."
                btnAddItem.Text = "Add to Estimate"
            Else
                MessagePanel.InnerHtml = "The item has been updated in your estimate."
                btnAddItem.Text = "Update Item"
            End If

        End Sub

#End Region

#Region "Control Events"


        Protected Sub btnAddItem_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnAddItem.Click
            If Not ValidateFields() Then
                Return
            End If

            Dim OrderItem As OrderItemEntity
            Dim AccOrderItem As OrderItemEntity

            If Not IsNothing(OrderItemDetail) Then
                EditMode = PageMode.Edit
                OrderItem = _OrderManager.OrderItemSelect(OrderItemDetail.LineId)
            Else
                EditMode = PageMode.Add
                OrderItem = New OrderItemEntity()
            End If

            'See if the specified item group exists. If so, associate it with the order item. If not, create it
            If String.IsNullOrEmpty(ItemGroups.Text) OrElse ItemGroups.Text.ToLower() = "base bid" Then
                OrderItem.GroupId = Nothing
            Else
                Dim OrderItemGroup As OrderItemGroupEntity = _OrderManager.OrderItemGroupSelect(ItemGroups.Text)
                If IsNothing(OrderItemGroup) Then
                    'create group
                    OrderItemGroup = _OrderManager.OrderItemGroupInsert(Estimate.OrderId, ItemGroups.Text)
                End If
                OrderItem.GroupId = OrderItemGroup.GroupId
            End If

            Dim Item As NodeItemViewEntity = _TreeManager.NodeSelect(NodeId)
            OrderItem.OrderId = Estimate.OrderId
            OrderItem.ItemId = ItemID
            OrderItem.BaseLineId = Nothing
            OrderItem.Qty = CInt(Quantity.Text)
            OrderItem.NetPrice = CDec(Price.Text)
            OrderItem.ExtPrice = OrderItem.Qty * OrderItem.NetPrice
            OrderItem.RemodelerProdRate = Item.RemodelerProdRate.GetValueOrDefault()
            OrderItem.PlumberProdRate = Item.PlumberProdRate.GetValueOrDefault()
            OrderItem.ElectricianProdRate = Item.ElectricianProdRate.GetValueOrDefault()
            OrderItem.TinnerProdRate = Item.TinnerProdRate.GetValueOrDefault()
            OrderItem.DesignerProdRate = Item.DesignerProdRate.GetValueOrDefault()
            OrderItem.MaterialMarkup = Estimate.MaterialMarkup
            OrderItem.LaborMarkup = Estimate.LaborMarkup
            OrderItem.SubMarkup = Estimate.SubMarkup
            OrderItem.Comments = Comment.Text

            If OrderItem.IsNew Then
                _OrderManager.OrderItemInsert(OrderItem)
            Else
                _OrderManager.OrderItemUpdate(OrderItem)
            End If

            'It is easiest to just delete all item accessories in the estimate that have BaseLineID=LineID first, so we can then add the accessories
            'using the logic below
            _OrderManager.OrderItemListDelete(Estimate.OrderId, OrderItem.LineId)

            'Add an item for each item accessory that is checked
            For Each Row As GridViewRow In XGrid.Rows
                Dim Selected As CheckBox = CType(Row.FindControl("chkSelect"), CheckBox)
                Dim Qty As TextBox = CType(Row.FindControl("txtQty"), TextBox)
                Dim AccessoryItemID As Integer = CInt(XGrid.DataKeys(Row.RowIndex).Value)
                If Selected.Checked Then
                    'add item to estimate
                    AccOrderItem = New OrderItemEntity()
                    AccOrderItem.OrderId = Estimate.OrderId
                    AccOrderItem.ItemId = AccessoryItemID
                    AccOrderItem.BaseLineId = OrderItem.LineId
                    AccOrderItem.Qty = CInt(Qty.Text)

                    'Get the accessory item
                    Dim AccessoryItem As ItemEntity = _ItemManager.ItemSelect(AccessoryItemID)
                    AccOrderItem.NetPrice = _ItemManager.ItemPrice(AccessoryItem.Price, AccessoryItem.RemodelerProdRate, AccessoryItem.TinnerProdRate, _
                        AccessoryItem.ElectricianProdRate, AccessoryItem.DesignerProdRate, AccessoryItem.RemodelerProdRate, Subscriber, Estimate)
                    AccOrderItem.ExtPrice = AccOrderItem.Qty * AccOrderItem.NetPrice
                    AccOrderItem.RemodelerProdRate = AccessoryItem.RemodelerProdRate.GetValueOrDefault()
                    AccOrderItem.PlumberProdRate = AccessoryItem.PlumberProdRate.GetValueOrDefault()
                    AccOrderItem.ElectricianProdRate = AccessoryItem.ElectricianProdRate.GetValueOrDefault()
                    AccOrderItem.TinnerProdRate = AccessoryItem.TinnerProdRate.GetValueOrDefault()
                    AccOrderItem.DesignerProdRate = AccessoryItem.DesignerProdRate.GetValueOrDefault()
                    AccOrderItem.MaterialMarkup = Estimate.MaterialMarkup
                    AccOrderItem.LaborMarkup = Estimate.LaborMarkup
                    AccOrderItem.SubMarkup = Estimate.SubMarkup
                    'assign accessory to the same group as the order item
                    AccOrderItem.GroupId = OrderItem.GroupId

                    'TODO: Handle case where same accessory item already exists in the estimate
                    _OrderManager.OrderItemInsert(AccOrderItem)
                End If
            Next

            'Calculate the new order total
            Estimate.OrderTotal = _OrderManager.CalculateOrderTotal(Estimate.OrderId)
            _OrderManager.OrderUpdate(Estimate)

            MessagePanel.Visible = True

            'switch to Edit mode to signal we're updating rather than adding
            'EditMode = PageMode.Edit
        End Sub

        Protected Sub XGrid_RowDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewRowEventArgs) Handles XGrid.RowDataBound

            Dim XImage As Image
            Dim chkSelect As CheckBox
            Dim txtQty As TextBox

            If e.Row.RowType = DataControlRowType.DataRow Then
                Dim Accessory As NodeItemViewEntity = CType(e.Row.DataItem, NodeItemViewEntity)
                XImage = CType(e.Row.FindControl("XImage"), Image)
                Dim Image As ImageEntity = _ItemManager.ImageSelectByItem(Accessory.ItemId)
                If Not IsNothing(Image) Then
                    XImage.ImageUrl = String.Format("~/WebPages/GetData.aspx?ItemID={0}&DoThumb=50", Accessory.ItemId)
                    XImage.AlternateText = Accessory.Name
                Else
                    XImage.Visible = False
                End If

                For Each AccOrderItem As OrderItemDetailViewEntity In _OrderItemAccessories
                    If AccOrderItem.ItemId = Accessory.ItemId Then
                        chkSelect = CType(e.Row.FindControl("chkSelect"), CheckBox)
                        txtQty = CType(e.Row.FindControl("txtQty"), TextBox)
                        chkSelect.Checked = True
                        txtQty.Text = CStr(AccOrderItem.Qty)
                    End If
                Next
            End If
        End Sub

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
                                Thumb4.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=75"
                                Thumb4.Visible = True
                            Case 4
                                Thumb3.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb3.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=75"
                                Thumb3.Visible = True
                            Case 3
                                Thumb2.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb2.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=75"
                                Thumb2.Visible = True
                            Case 2
                                Thumb1.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                Thumb1.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=75"
                                Thumb1.Visible = True
                            Case 1
                                SecondImage.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                SecondImage.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=150"
                                SecondImage.Visible = True
                            Case 0
                                MainImage.Attributes.Add("onclick", String.Format(LargeImageViewCommand, Images(I).ImageId))
                                MainImage.ImageUrl = "~/WebPages/GetData.aspx?ImgID=" & Images(I).ImageId & "&DoThumb=150"
                                MainImage.Visible = True
                        End Select
                    Catch ex As Exception

                    End Try
                Next

                'get a list of all the documents associated with this item
                DataBindDocuments()

                'Get a list of all the item groups defined for this estimate
                DataBindItemGroups()

                If Not IsNothing(OrderItemDetail) Then
                    'Load from selected OrderItem
                    Price.Text = Format(OrderItemDetail.NetPrice, "$0.00")
                    Quantity.Text = CStr(OrderItemDetail.Qty)
                    Comment.Text = OrderItemDetail.Comments
                    ItemGroups.Text = OrderItemDetail.GroupName
                    _OrderItemAccessories = _OrderManager.OrderItemDetailViewList(Estimate.OrderId, OrderItemDetail.LineId)
                    EditMode = PageMode.Edit
                Else
                    Price.Text = GetPrice(ItemID)
                    Quantity.Text = "1"
                    Comment.Text = ""
                End If

                'Get a list of all accessories that are associated with this item
                Dim ItemAccessories As EntityCollection(Of NodeItemViewEntity) = _ItemManager.ItemAccessoryItemList(Item.ItemId)
                XGrid.DataSource = ItemAccessories
                XGrid.DataBind()

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

        Private Sub DataBindItemGroups()
            If Not IsNothing(Estimate) Then
                Dim Collection As EntityCollection(Of OrderItemGroupEntity) = _OrderManager.OrderItemGroupList(Estimate.OrderId)

                ItemGroups.DataSource = Collection
                ItemGroups.DataTextField = "Name"
                ItemGroups.DataValueField = "GroupID"
                ItemGroups.DataBind()
            End If

        End Sub

        Private Sub DataBindDocuments()
            Dim Collection As EntityCollection(Of DocumentEntity) = _ItemManager.DocumentList(ItemID)

            Documents.DataSource = Collection
            Documents.DataKeyField = "DocumentID"
            Documents.DataBind()

            DocumentDiv.Visible = (Collection.Count > 0)
        End Sub

        Private Sub SetVisibility()

            If IsNothing(Estimate) OrElse Estimate.Locked Then
                btnAddItem.Visible = False
                ItemGroupDiv.Visible = False
                Quantity.Visible = False
                Comment.Visible = False
                'don't show selection or quantity fields in the Accessory grid
                XGrid.Columns(0).Visible = False    'select
                XGrid.Columns(4).Visible = False    'quantity
            End If
            UpdateControlMode(False)

        End Sub

        Private Sub UpdateControlMode(ByVal isReadOnly As Boolean)

        End Sub

        Private Function ValidateFields() As Boolean
            Dim Errors As New StringBuilder()
            Dim Result As Integer

            If Not Integer.TryParse(Quantity.Text, Result) OrElse CInt(Quantity.Text) < 1 Then
                Errors.Append("Quantity must be 1 or more.").Append("<BR/>")
            End If
            If ItemGroups.Text.Length > 50 Then
                Errors.Append("Item Group name must be 50 characters or less.").Append("<BR/>")
            End If
            If Comment.Text.Length > 255 Then
                Errors.Append("Comment must be 255 characters or less.").Append("<BR/>")
            End If
            
            'if any accessory items are checked, make sure their Qty fields are set to 1 or more
            For Each Row As GridViewRow In XGrid.Rows
                Dim Selected As CheckBox = CType(Row.FindControl("chkSelect"), CheckBox)
                Dim Qty As TextBox = CType(Row.FindControl("txtQty"), TextBox)
                If Selected.Checked Then
                    If Not IsPositiveInteger(Qty.Text, False) Then
                        Errors.Append("Please specify a valid quantity for all item accessories that you have selected.").Append("<BR/>")
                        Exit For
                    End If
                End If
            Next

            If Errors.Length > 0 Then
                ErrorPanel.Visible = True
                ErrorMessage.InnerHtml = Errors.ToString().Trim("<BR/>".ToCharArray())
                Return False
            Else
                ErrorPanel.Visible = False
                ErrorMessage.InnerHtml = ""
                Return True
            End If

        End Function

#End Region

    End Class

End Namespace
