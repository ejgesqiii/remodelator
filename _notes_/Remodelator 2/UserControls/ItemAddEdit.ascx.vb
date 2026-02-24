Option Strict On

Imports Microsoft.VisualBasic
Imports System.Diagnostics
Imports System.ComponentModel
Imports System.IO
Imports System.Drawing
Imports System.Drawing.Imaging
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

    Partial Class ItemAddEdit
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()
        Dim _ItemManager As New ItemManager()
        Dim _BaseClassManager As New BaseClassManager()
        Dim _ActivityManager As New ActivityManager()
        Dim _Tree As TreeView
        Const TREE_CONTROL_NAME As String = "ctl00_CP_IC_tvItems2"
        Const PRODUCT_IMAGE_PATH As String = "../Images/Products/"
        Const PDF_PATH As String = "../PDFs/"

#Region "Public Properties"

        Property ItemId() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("ItemId")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("ItemId") = value
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

        ReadOnly Property CurrentNodeType() As NodeType
            Get
                Return Utilities.GetNodeType(NodeTypeId)
            End Get
        End Property

        Property ParentNodeId() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("ParentNodeId")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("ParentNodeId") = value
            End Set
        End Property

        Property OldParentNodeId() As Nullable(Of Integer)
            Get
                Dim o As Object = ViewState("OldParentNodeId")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                ViewState("OldParentNodeId") = value
            End Set
        End Property

        Property Action() As PageAction
            Get
                Dim o As Object = ViewState("Action")
                If IsNothing(o) Then
                    Return PageAction.None
                Else
                    Return CType(o, PageAction)
                End If
            End Get
            Set(ByVal value As PageAction)
                ViewState("Action") = value
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

            ErrorPanel.Visible = False
            ErrorMessage.InnerHtml = ""
            SuccessPanel.Visible = False
            SuccessPanel.InnerHtml = ""

            If Not Page.IsPostBack Then
                'CreateVendor.Attributes("href") = "javascript:" & ucVendorAddEdit.DialogId & ".Show();"
            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            SetVisibility()
            SaveImageData()

            If Not Page.IsPostBack Then

            End If

            If Reload Then
                DatabindUnits()
                DatabindVendors()
                DatabindItemClasss()
                LoadData(NodeId)
                Reload = False
            End If

            If CurrentNodeType = NodeType.Folder Then
                btnDelete2.OnClientClick = "return confirm('Are you sure you want to delete this folder?');"
            ElseIf CurrentNodeType = NodeType.Item Then
                btnDelete2.OnClientClick = "return confirm('Are you sure you want to delete this item?');"
            ElseIf CurrentNodeType = NodeType.Accessory Then
                btnDelete2.OnClientClick = "return confirm('Are you sure you want to delete this accessory?');"
            Else
                'do nothing
            End If

            Dim jsFunctionCall As String = String.Format("GetPrice('{0}')", "ctl00_CP_IC_IAE_")
            RemUnits.Attributes("onchange") = jsFunctionCall
            ElecUnits.Attributes("onchange") = jsFunctionCall
            PlumUnits.Attributes("onchange") = jsFunctionCall
            TinUnits.Attributes("onchange") = jsFunctionCall
            DesignUnits.Attributes("onchange") = jsFunctionCall
            Price.Attributes("onchange") = jsFunctionCall
        End Sub

#End Region

#Region "Control Events"

        ''' <summary>
        ''' Fires when Save Next is clicked
        ''' </summary>
        ''' <param name="sender"></param>
        ''' <param name="e"></param>
        ''' <remarks></remarks>
        Protected Sub btnSaveNext2_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSaveNext2.Click
            SaveChanges(True)
        End Sub

        ''' <summary>
        ''' Fires when Save is clicked
        ''' </summary>
        ''' <param name="sender"></param>
        ''' <param name="e"></param>
        ''' <remarks></remarks>
        Protected Sub btnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSave.Click, btnSave2.Click
            SaveChanges(False)
        End Sub

        Protected Sub btnCancel_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnCancel.Click, btnCancel2.Click
            Reload = True
            ShowSuccess("You changes have been discarded.")
        End Sub

        Protected Sub btnDelete2_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnDelete2.Click
            Dim Tree As TreeView = CType(FindControlRecursive(Page, TREE_CONTROL_NAME), TreeView)
            Dim Node As TreeViewNode = Tree.SelectedNode
            Dim NodeInfo As NodeInfo = New NodeInfo(Node)

            'Get the node's item ID so we can log activity after the delete
            Dim NodeObj As NodeItemViewEntity = _TreeManager.NodeSelect(NodeInfo.NodeID)
            Dim ItemID As Integer = NodeObj.ItemId

            'remove from database
            _TreeManager.NodeDelete(NodeInfo.NodeID)

            'Log the deletion
            Dim ActivityManager As New ActivityManager()
            ActivityManager.TrackingInsert(Subscriber.SubscriberId, ItemID, 3)

            'now remove from tree
            Dim ParentNode As TreeViewNode = Node.ParentNode
            If IsNothing(ParentNode) Then
                'we're at the tree root
                Tree.Nodes.Remove(Node)
                Tree.SelectedNode = Nothing

                PropertiesDiv.Visible = False
                FolderDiv.Visible = False
                ItemDiv.Visible = False
                NodeTypeId = Nothing
                NodeId = Nothing
                ParentNodeId = Nothing
                ClearFields()
            Else
                ParentNode.Nodes.Remove(Node)
                'select parent node of node just deleted
                Tree.SelectedNode = ParentNode
                ClearFields()

                NodeInfo = New NodeInfo(ParentNode)
                Dim NodeItemView As NodeItemViewEntity = _TreeManager.NodeSelect(NodeInfo.NodeID)

                FolderName.Text = NodeItemView.Name
                FolderPosition.Text = NodeItemView.Position.ToString()
                FolderParentNode.Text = NodeItemView.ParentId.ToString()
                FolderPrefix.Text = NodeItemView.Prefix

                'a folder will always be the selected node when deleting ANY item from the tree
                NodeTypeId = NodeInfo.NodeTypeID
                NodeId = NodeInfo.NodeID
                ParentNodeId = Nothing

                Action = PageAction.Update
            End If

            ShowSuccess("The data has been successfully deleted.")
        End Sub

        Protected Sub Images_ItemCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.DataListCommandEventArgs) Handles Images.ItemCommand

            Dim ImageID As Integer = CInt(Images.DataKeys(e.Item.ItemIndex))
            Dim Command As String = e.CommandName

            Select Case (Command)

                Case "Delete"
                    _ItemManager.ImageDelete(ImageID)
                    DataBindImages()
                Case "Ratings"
            End Select

        End Sub

        Protected Sub btnUploadImage_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnUploadImage.Click

            Dim imgName, imgContentType, imgName2, imgContentType2 As String
            Dim imgbin(), imgbin2() As Byte
            Dim imgLen As Int32
            Dim uploadedFiles As HttpFileCollection = Request.Files
            Dim i As Integer = 0

            Do Until i = uploadedFiles.Count
                Dim userPostedFile As HttpPostedFile = uploadedFiles(i)
                Dim Text As New StringBuilder()

                Try
                    If (userPostedFile.ContentLength > 0) Then
                        Dim imgStream As Stream = userPostedFile.InputStream()
                        imgContentType = userPostedFile.ContentType
                        imgName = userPostedFile.FileName.Substring(userPostedFile.FileName.LastIndexOf("\") + 1)

                        imgLen = userPostedFile.ContentLength
                        Dim imgBinaryData(imgLen) As Byte
                        Dim n As Int32 = imgStream.Read(imgBinaryData, 0, imgLen)
                        imgbin = imgBinaryData

                        'Create Thumbnail
                        imgName2 = "Thumb_" & imgName
                        imgContentType2 = imgContentType
                        imgbin2 = createThumnail(imgStream, 145, 145)

                        'Save images to Database
                        _ItemManager.ImageInsert(ItemId.GetValueOrDefault(), imgName, imgContentType, imgbin, 0)

                        're-databind so we can see the newly uploaded image!
                        DataBindImages()
                    End If
                Catch ex As Exception
                    Debug.WriteLine("Error:<br>" & ex.Message)
                End Try
                i += 1
            Loop

            ''check if file is empty
            ' If Not ImagePath.PostedFile Is Nothing Then

            '     If ImagePath.PostedFile.FileName.Trim.Length > 0 And ImagePath.PostedFile.ContentLength > 0 Then
            '         Dim imgStream As Stream = ImagePath.PostedFile.InputStream()
            '         imgContentType = ImagePath.PostedFile.ContentType
            '         imgName = ImagePath.PostedFile.FileName.Substring(ImagePath.PostedFile.FileName.LastIndexOf("\") + 1)

            '         imgLen = ImagePath.PostedFile.ContentLength
            '         Dim imgBinaryData(imgLen) As Byte
            '         Dim n As Int32 = imgStream.Read(imgBinaryData, 0, imgLen)
            '         imgbin = imgBinaryData

            '         'Create Thumbnail
            '         imgName2 = "Thumb_" & imgName
            '         imgContentType2 = imgContentType
            '         imgbin2 = createThumnail(imgStream, 145, 145)

            '         'Save images to Database
            '         _ItemManager.ImageInsert(ItemId.GetValueOrDefault(), imgName, imgContentType, imgbin, 0)

            '         're-databind so we can see the newly uploaded image!
            '         DatabindImages()

            '     End If
            ' End If
        End Sub

        Protected Sub Documents_ItemCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.DataListCommandEventArgs) Handles Documents.ItemCommand

            Dim DocumentID As Integer = CInt(Documents.DataKeys(e.Item.ItemIndex))
            Dim Command As String = e.CommandName

            Select Case (Command)

                Case "Delete"
                    _ItemManager.DocumentDelete(DocumentID)
                    DataBindDocuments()
                Case "Ratings"
            End Select

        End Sub

        Protected Sub btnUploadDocument_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnUploadDocument.Click

            Dim imgName, imgContentType As String
            Dim imgbin() As Byte
            Dim imgLen As Int32
            Dim IsOptionsDoc As Boolean

            'check if file is empty
            If Not DocumentPath.PostedFile Is Nothing Then

                If DocumentPath.PostedFile.FileName.Trim.Length > 0 And DocumentPath.PostedFile.ContentLength > 0 Then
                    Dim imgStream As Stream = DocumentPath.PostedFile.InputStream()
                    imgContentType = DocumentPath.PostedFile.ContentType
                    imgName = DocumentPath.PostedFile.FileName.Substring(DocumentPath.PostedFile.FileName.LastIndexOf("\") + 1)

                    imgLen = DocumentPath.PostedFile.ContentLength
                    Dim imgBinaryData(imgLen) As Byte
                    Dim n As Int32 = imgStream.Read(imgBinaryData, 0, imgLen)
                    imgbin = imgBinaryData

                    IsOptionsDoc = (DocumentChoice.SelectedValue = "0")
                    'Save Documents to Database
                    _ItemManager.DocumentInsert(ItemId.GetValueOrDefault(), imgName, imgContentType, imgbin, 0, IsOptionsDoc)

                    're-databind so we can see the newly uploaded Document!
                    DataBindDocuments()

                End If
            End If
        End Sub

#End Region

#Region "Public Helpers"

        Public Function GetPrice(ByVal ItemID As Integer) As String
            Dim Item As ItemEntity = _ItemManager.ItemSelect(ItemID)
            Return Format(_ItemManager.ItemPrice(Item.Price, Item.PlumberProdRate, Item.TinnerProdRate, Item.ElectricianProdRate, Item.DesignerProdRate, _
                Item.RemodelerProdRate, Subscriber, Nothing), "$0.00")
        End Function

        Public Sub Reset()
            NodeId = -1
            NodeTypeId = -1
            ParentNodeId = -1
        End Sub

        Public Function ValidateFields() As Boolean
            Dim Errors As New StringBuilder()
            Dim Result As Integer
            Dim ParentID As Integer

            If FolderDiv.Visible Then
                'folder editing
                If Len(FolderName.Text) < 3 Then
                    Errors.Append("The Name must be at least 3 characters.").Append("<BR/>")
                End If
                If Not String.IsNullOrEmpty(FolderPosition.Text) Then
                    If Not Integer.TryParse(FolderPosition.Text, Result) OrElse CInt(FolderPosition.Text) < 0 Then
                        Errors.Append("The Node Position must be an integer value 0 or greater.").Append("<BR/>")
                    End If
                End If
                If Action = PageAction.Add Or Action = PageAction.Update Then
                    If Not String.IsNullOrEmpty(FolderParentNode.Text) Then
                        If Not Integer.TryParse(FolderParentNode.Text, Result) Then
                            'parent folder ID must be a valid integer value
                            Errors.Append("The Parent Node ID you specified doesn't exist.").Append("<BR/>")
                        Else
                            ParentID = CInt(FolderParentNode.Text)
                            Dim NodeItemView As NodeItemViewEntity = _TreeManager.NodeSelect(ParentID)
                            If IsNothing(NodeItemView) Then
                                'Parent Node Id doesn't exist
                                Errors.Append("The Parent Node ID you specified doesn't exist.").Append("<BR/>")
                            ElseIf NodeItemView.NodeTypeId = 1 Or NodeItemView.NodeTypeId = 3 Then
                                'parent node cannot be an item node
                                Errors.Append("The Parent Node ID you specified is not a folder node.").Append("<BR/>")
                            Else
                                'parent node cannot be the current node or a child of current node
                                Dim Nodes As EntityCollection(Of TreeEntity) = _TreeManager.TreeDecendantList(NodeId)
                                For Each Node As TreeEntity In Nodes
                                    If Node.NodeId = ParentID Then
                                        Errors.Append("The Parent Node ID you specified must be in a different node branch.").Append("<BR/>")
                                        Exit For
                                    End If
                                Next
                            End If
                        End If
                    End If
                    If Not String.IsNullOrEmpty(FolderPrefix.Text) Then
                        'TODO: Validation
                    End If
                Else
                    'nothing needs to be verified for copy operation, since copy of folder isn't allowed
                End If
            ElseIf ItemDiv.Visible Then
                'item editing
                If Len(ItemDescription.Text) < 3 Then
                    Errors.Append("The Item Description must be at least 3 characters.").Append("<BR/>")
                End If
                If Not IsPositiveNumber(Price.Text) Then
                    Errors.Append("Part price must be greater than $0.00.").Append("<BR/>")
                End If
                If Not IsPositiveNumber(RemUnits.Text) Then
                    Errors.Append("Remodeler Units must be 0 or greater.").Append("<BR/>")
                End If
                If Not IsPositiveNumber(ElecUnits.Text) Then
                    Errors.Append("Electrician Units must be 0 or greater.").Append("<BR/>")
                End If
                If Not IsPositiveNumber(PlumUnits.Text) Then
                    Errors.Append("Plumber Units must be 0 or greater.").Append("<BR/>")
                End If
                If Not IsPositiveNumber(TinUnits.Text) Then
                    Errors.Append("Tinner Units must be 0 or greater.").Append("<BR/>")
                End If
                If Not IsPositiveNumber(DesignUnits.Text) Then
                    Errors.Append("Designer Units must be 0 or greater.").Append("<BR/>")
                End If
                If Not Integer.TryParse(ItemPosition.Text, Result) OrElse CInt(ItemPosition.Text) < 0 Then
                    Errors.Append("The Node Position must be an integer value 0 or greater.").Append("<BR/>")
                End If
                If Action = PageAction.Add Or Action = PageAction.Update Or Action = PageAction.Copy Then
                    If Not String.IsNullOrEmpty(ItemParentNode.Text) Then
                        If Not Integer.TryParse(ItemParentNode.Text, Result) Then
                            'parent folder ID must be a valid integer value
                            Errors.Append("The Parent Node ID you specified doesn't exist.").Append("<BR/>")
                        Else
                            ParentID = CInt(ItemParentNode.Text)
                            Dim NodeItemView As NodeItemViewEntity = _TreeManager.NodeSelect(ParentID)
                            If IsNothing(NodeItemView) Then
                                'Parent Node Id doesn't exist
                                Errors.Append("The Parent Node ID you specified doesn't exist.").Append("<BR/>")
                            ElseIf NodeItemView.NodeTypeId = 1 Or NodeItemView.NodeTypeId = 3 Then
                                'parent node cannot be an item node
                                Errors.Append("The Parent Node ID you specified is not a folder node.").Append("<BR/>")
                            Else
                                'parent node cannot be the current node or a child of current node
                                Dim Nodes As EntityCollection(Of TreeEntity) = _TreeManager.TreeDecendantList(NodeId)
                                For Each Node As TreeEntity In Nodes
                                    If Node.NodeId = ParentID Then
                                        Errors.Append("The Parent Node ID you specified must be in a different node branch.").Append("<BR/>")
                                        Exit For
                                    End If
                                Next
                            End If
                        End If
                    End If
                Else
                    'nothing needs to be verified for copy operation, since copy of folder isn't allowed
                End If
            End If

            If Errors.Length > 0 Then
                ErrorPanel.Visible = True
                ErrorMessage.InnerHtml = Errors.ToString()
                Return False
            Else
                ErrorPanel.Visible = False
                ErrorMessage.InnerHtml = ""
                Return True
            End If

        End Function

#End Region

#Region "Private Helpers"

        ''' <summary>
        ''' Saves changes to a folder or item
        ''' </summary>
        ''' <param name="DoNext"></param>
        ''' <remarks></remarks>
        Private Sub SaveChanges(ByVal DoNext As Boolean)
            Dim NodePosition, OldPosition, SelectedNodeID As Integer
            Dim ParentID As Nullable(Of Integer) = Nothing
            Dim OldParentID As Nullable(Of Integer) = Nothing
            Dim NodeData As NodeInfo = Nothing
            Dim Node As NodeItemViewEntity = Nothing
            Dim SelectedTreeNodeID As String

            Dim Tree As TreeView = CType(FindControlRecursive(Page, TREE_CONTROL_NAME), TreeView)
            Dim SelectedNode As TreeViewNode = Tree.SelectedNode

            If Not IsNothing(SelectedNode) Then
                NodeData = New NodeInfo(SelectedNode)
                SelectedNodeID = NodeData.NodeID
            End If

            If Not ValidateFields() Then
                Return
            End If

            Try
                If FolderDiv.Visible Then
                    'saving folder info
                    ParentID = Nothing
                    If Not String.IsNullOrEmpty(FolderParentNode.Text) Then
                        ParentID = CInt(FolderParentNode.Text)
                    End If
                    NodePosition = 0
                    If FolderPosition.Text <> "" Then
                        NodePosition = CInt(FolderPosition.Text)
                    End If
                    If Action = PageAction.Update Then
                        Node = _TreeManager.NodeSelect(NodeData.NodeID)
                        Node.EditsComplete = True       'always complete
                        OldParentID = Node.ParentId
                        'update db
                        _TreeManager.NodeUpdate(NodeData.NodeID, FolderName.Text, ParentID, FolderPrefix.Text, NodePosition)
                        SelectedNodeID = NodeData.NodeID
                        Node = _TreeManager.NodeSelect(NodeData.NodeID)
                        _ActivityManager.TrackingInsert(Subscriber.SubscriberId, Node.ItemId, 2)
                    Else
                        OldParentNodeId = Nothing
                        If Action = PageAction.Add Then
                            'update db
                            Node = _TreeManager.NodeInsert(ParentID, FolderName.Text, 2, FolderPrefix.Text, NodePosition)
                            _ActivityManager.TrackingInsert(Subscriber.SubscriberId, Node.ItemId, 1)
                            If Not DoNext Then
                                SelectedNodeID = Node.NodeId
                                FolderPrefix.Text = Node.Prefix
                                FolderPosition.Text = Node.Position.ToString()
                                FolderParentNode.Text = Node.ParentId.ToString()
                            Else
                                'do not auto-select the newly created node. Reset fields and create another node.
                                ClearFields()
                                FolderParentNode.Text = ParentID.ToString()
                            End If
                        ElseIf Action = PageAction.Copy Then
                            Node = _TreeManager.NodeCopy(NodeData.NodeID, ParentID, NodePosition)
                            SelectedNodeID = Node.NodeId
                        Else
                            'TODO
                        End If
                    End If
                    SelectedTreeNodeID = NodeInfo.MakeNodeID(SelectedNodeID, 2)
                Else
                    Dim SelectedNodeTypeId As Integer = ItemNodeTypeID
                    ParentID = Nothing
                    If Not String.IsNullOrEmpty(ItemParentNode.Text) Then
                        ParentID = CInt(ItemParentNode.Text)
                    End If
                    If Action = PageAction.Copy Then
                        'don't allow reference to be created to a NULL Parent, or to the same parent as the current node
                        If IsNothing(ParentID) Then
                            ErrorPanel.Visible = True
                            ErrorMessage.InnerHtml = "You must specify a Parent Node Id."
                            Exit Sub
                        Else
                            Node = _TreeManager.NodeSelect(NodeData.NodeID)
                            If Node.ParentId.GetValueOrDefault() = ParentID.GetValueOrDefault() Then
                                ErrorPanel.Visible = True
                                ErrorMessage.InnerHtml = "Please specify a Parent Node Id that is different than the current Parent Node Id."
                                Exit Sub
                            End If
                        End If
                        Node = _TreeManager.NodeCopy(NodeData.NodeID, ParentID, NodePosition)
                        SelectedNodeID = Node.NodeId
                    Else
                        'editing an item
                        If Action = PageAction.Update Then
                            Node = _TreeManager.NodeSelect(NodeData.NodeID)
                            OldParentID = Node.ParentId
                        ElseIf Action = PageAction.Add Then
                            Node = New NodeItemViewEntity()
                            OldParentID = Nothing
                            OldParentNodeId = Nothing
                        Else
                            'TODO
                        End If

                        Node.EditsComplete = EditsComplete.Checked
                        Node.ItemCode = ItemCode.Text
                        Node.VendorCode = VendorCode.Text
                        Node.Name = ItemDescription.Text
                        Node.ParentId = ParentID
                        Node.NodeTypeId = ItemNodeTypeID
                        Node.RateDescription = RateDesc.Text
                        Node.LaborNotes = LaborNotes.Text
                        Node.LaborDescription = LaborDescription.Text
                        If Units.SelectedIndex > 0 Then
                            Node.UnitId = CInt(Units.SelectedValue)
                        End If
                        If Not String.IsNullOrEmpty(Price.Text) Then
                            Node.Price = CDec(Price.Text)
                        End If
                        If Not String.IsNullOrEmpty(RemUnits.Text) Then
                            Node.RemodelerProdRate = CDec(RemUnits.Text)
                        End If
                        If Not String.IsNullOrEmpty(ElecUnits.Text) Then
                            Node.ElectricianProdRate = CDec(ElecUnits.Text)
                        End If
                        If Not String.IsNullOrEmpty(PlumUnits.Text) Then
                            Node.PlumberProdRate = CDec(PlumUnits.Text)
                        End If
                        If Not String.IsNullOrEmpty(TinUnits.Text) Then
                            Node.TinnerProdRate = CDec(TinUnits.Text)
                        End If
                        If Not String.IsNullOrEmpty(DesignUnits.Text) Then
                            Node.DesignerProdRate = CDec(DesignUnits.Text)
                        End If
                        Dim Vendor As VendorEntity = _BaseClassManager.VendorSelect(Vendors.Text)
                        If IsNothing(Vendor) Then
                            'create new
                            Vendor = _BaseClassManager.VendorInsert(Vendors.Text)
                        End If
                        Node.VendorId = Vendor.VendorId
                        ''Doesn't work with Combobox control for some reason...
                        'If Vendors.SelectedIndex > 0 Then
                        '    Node.VendorId = CInt(Vendors.SelectedValue)
                        'End If
                        If Classes.SelectedIndex > 0 Then
                            Node.ItemClassId = CInt(Classes.SelectedValue)
                        End If

                        'update database
                        If ItemPosition.Text <> "" Then
                            OldPosition = Node.Position
                            Node.Position = CInt(ItemPosition.Text)
                        Else
                            Node.Position = 0
                        End If

                        If Action = PageAction.Update Then
                            'update database
                            _TreeManager.NodeUpdate(Node, OldPosition, OldParentID)
                            SelectedNodeID = NodeData.NodeID
                            'Update the item code just in case one was created while saving the node
                            ItemCode.Text = Node.ItemCode
                            _ActivityManager.TrackingInsert(Subscriber.SubscriberId, Node.ItemId, 2)
                        ElseIf Action = PageAction.Add Then
                            'update database
                            Node = _TreeManager.NodeInsert(Node)
                            _ActivityManager.TrackingInsert(Subscriber.SubscriberId, Node.ItemId, 1)
                            If Not DoNext Then
                                SelectedNodeID = Node.NodeId
                                SelectedTreeNodeID = NodeInfo.MakeNodeID(SelectedNodeID, ItemNodeTypeID)

                                'Update the item code just in case one was created while saving the node
                                ItemCode.Text = Node.ItemCode
                                'Update the parent node id that was just assigned
                                ItemParentNode.Text = Node.ParentId.ToString()
                            End If
                        ElseIf Action = PageAction.Copy Then
                            Node = _TreeManager.NodeCopy(NodeData.NodeID, ParentID, NodePosition)
                            SelectedNodeID = Node.NodeId
                        Else
                            'TODO
                        End If

                        'Add new bullets
                        Dim BulletList As New List(Of String)
                        BulletList.Add(Bullet1.Text)
                        BulletList.Add(Bullet2.Text)
                        BulletList.Add(Bullet3.Text)
                        BulletList.Add(Bullet4.Text)
                        BulletList.Add(Bullet5.Text)
                        BulletList.Add(Bullet6.Text)
                        _ItemManager.ItemBulletListInsert(Node.ItemId, BulletList)

                        'Save ItemAccessory selections
                        Dim SelectedAccessoryIDs As New List(Of Integer)    'array of ItemID values
                        Dim Index As Integer = 0
                        For Each Item As GridViewRow In XGrid.Rows
                            Dim C As CheckBox = CType(Item.FindControl("chkSelect"), CheckBox)

                            If C.Checked Then
                                SelectedAccessoryIDs.Add(CInt(XGrid.DataKeys.Item(Index).Value))
                            End If
                            Index += 1
                        Next
                        _ItemManager.ItemAccessoryListUpdate(Node.ItemId, SelectedAccessoryIDs)

                        'update item price
                        ExtPrice.Text = Format(_ItemManager.ItemPrice(Node.Price, Node.PlumberProdRate, Node.TinnerProdRate, Node.ElectricianProdRate, Node.DesignerProdRate, _
                            Node.RemodelerProdRate, Subscriber, Nothing), "$0.00")

                        If DoNext Then
                            'do not auto-select the newly created node. Reset fields and create another node.
                            SelectedNodeTypeId = 2
                        End If
                    End If

                    SelectedTreeNodeID = NodeInfo.MakeNodeID(SelectedNodeID, SelectedNodeTypeId)
                    ItemId = Node.ItemId

                    'upload any images or files that haven't been uploaded yet!
                    btnUploadImage_Click(Nothing, Nothing)
                    btnUploadDocument_Click(Nothing, Nothing)

                    If DoNext Then
                        ClearFields()
                        ItemId = Nothing
                        ItemParentNode.Text = ParentID.ToString()
                    End If
                End If

                're-build the tree so we can auto-select the added/updated node
                Dim TreeHelper As New TreeHelper(Mode, Tree)
                TreeHelper.BuildTopLevelTree(SelectedNodeID)

                If ParentID.GetValueOrDefault() <> OldParentID.GetValueOrDefault() Then
                    'node was moved. Save off OldParentID
                    OldParentNodeId = OldParentID
                End If

                TreeHelper.ExpandTreePathToNode(OldParentNodeId.GetValueOrDefault())

                'select the new node
                Tree.SelectedNode = Tree.FindNodeById(SelectedTreeNodeID)

                If Action = PageAction.Copy Then
                    NodeId = SelectedNodeID
                    Reload = True
                End If

                If Not DoNext Then
                    Action = PageAction.Update
                Else
                    'Action = PageAction.Update
                End If

                ShowSuccess("The data has been successfully saved.")
            Catch dex As DatabaseException
                ShowError(dex.Message)
            End Try


        End Sub

        Private Sub SetPageConfig(ByVal NodeType As NodeType, ByVal Action As PageAction)
            SetPageConfig(CurrentNodeType, Action)
        End Sub

        Private Sub LoadData(ByVal NodeId As Integer)

            Dim Node As NodeItemViewEntity = _TreeManager.NodeSelect(NodeId)

            If Not IsNothing(Node) Then
                ItemId = Node.ItemId

                FolderName.Text = Node.Name
                FolderPosition.Text = Node.Position.ToString()
                FolderParentNode.Text = Node.ParentId.ToString()
                FolderPrefix.Text = Node.Prefix

                EditsComplete.Checked = Node.EditsComplete
                ItemCode.Text = Node.ItemCode
                VendorCode.Text = Node.VendorCode
                ItemDescription.Text = Node.Name
                ItemPosition.Text = Node.Position.ToString()
                ItemParentNode.Text = Node.ParentId.ToString()
                If Node.UnitId.GetValueOrDefault() > 0 Then
                    Units.SelectedValue = Node.UnitId.ToString()
                Else
                    Units.SelectedIndex = 0
                End If
                Price.Text = Format(Node.Price, "$0.00")
                RemUnits.Text = Node.RemodelerProdRate.ToString()
                ElecUnits.Text = Node.ElectricianProdRate.ToString()
                PlumUnits.Text = Node.PlumberProdRate.ToString()
                TinUnits.Text = Node.TinnerProdRate.ToString()
                DesignUnits.Text = Node.DesignerProdRate.ToString()
                RateDesc.Text = Node.RateDescription
                LaborNotes.Text = Node.LaborNotes
                LaborDescription.Text = Node.LaborDescription
                ExtPrice.Text = Format(_ItemManager.ItemPrice(Node.Price, Node.PlumberProdRate, Node.TinnerProdRate, Node.ElectricianProdRate, Node.DesignerProdRate, _
                    Node.RemodelerProdRate, Subscriber, Nothing), "$0.00")

                Dim ItemBullets As EntityCollection(Of ItemBulletEntity) = _ItemManager.ItemBulletList(Node.ItemId)
                Bullet1.Text = ItemBullets(0).BulletText
                Bullet2.Text = ItemBullets(1).BulletText
                Bullet3.Text = ItemBullets(2).BulletText
                Bullet4.Text = ItemBullets(3).BulletText
                Bullet5.Text = ItemBullets(4).BulletText
                Bullet6.Text = ItemBullets(5).BulletText

                If Node.VendorId.GetValueOrDefault() > 0 Then
                    'Doesn't work in CA for some reason!
                    'Vendors.SelectedValue = Node.VendorId.ToString()
                    Dim Vendor As VendorEntity = _BaseClassManager.VendorSelect(Node.VendorId.GetValueOrDefault())
                    If Not IsNothing(Vendor) Then
                        Vendors.Text = Vendor.Name
                    End If
                Else
                    Vendors.SelectedIndex = 0
                End If
                If Node.ItemClassId.GetValueOrDefault() > 0 Then
                    Classes.SelectedValue = Node.ItemClassId.ToString()
                Else
                    Classes.SelectedIndex = 0
                End If

                DataBindImages()
                DataBindDocuments()
                If Node.NodeTypeId = 1 Then
                    'get an accessory list for items
                    DataBindAccessories(Node.ParentId.GetValueOrDefault(), Node.ItemId)
                Else
                    XGrid.DataSource = Nothing
                    XGrid.DataBind()
                End If
            Else
                ClearFields()
                ItemId = Nothing
                FolderParentNode.Text = ParentNodeId.ToString()
                ItemParentNode.Text = ParentNodeId.ToString()
                DataBindAccessories(ParentNodeId.GetValueOrDefault())
            End If

            btnUploadDocument.Visible = ItemId.HasValue
            btnUploadImage.Visible = ItemId.HasValue

            If FolderDiv.Visible Then
                Page.SetFocus("ctl00_CP_ucItemConfig_IAE_FolderName_val")
            ElseIf ItemDiv.Visible Then
                Page.SetFocus("ctl00_CP_ucItemConfig_IAE_ItemDescription_val")
            End If
        End Sub

        Private Sub ClearFields()
            FolderName.Text = ""
            FolderPosition.Text = ""
            FolderParentNode.Text = ""
            FolderPrefix.Text = ""

            EditsComplete.Checked = False
            ItemCode.Text = ""
            VendorCode.Text = ""
            ItemDescription.Text = ""
            ItemPosition.Text = ""
            ItemParentNode.Text = ""
            Units.SelectedIndex = 0
            ExtPrice.Text = ""
            Price.Text = ""
            RemUnits.Text = ""
            ElecUnits.Text = ""
            PlumUnits.Text = ""
            TinUnits.Text = ""
            DesignUnits.Text = ""
            RateDesc.Text = ""
            LaborNotes.Text = ""
            LaborDescription.Text = ""

            Bullet1.Text = ""
            Bullet2.Text = ""
            Bullet3.Text = ""
            Bullet4.Text = ""
            Bullet5.Text = ""
            Bullet6.Text = ""

            Images.DataSource = Nothing
            Images.DataBind()

            Vendors.SelectedIndex = 0
            Classes.SelectedIndex = 0
        End Sub

        Private Sub SetVisibility()

            Dim SetReadonlyMode As Boolean = False

            Dim ItemText As String = ""
            If CurrentNodeType = NodeType.Folder Then
                ItemInfoDiv.Visible = True
                PropertiesDiv.Visible = True
                FolderDiv.Visible = True
                ItemDiv.Visible = False
                ItemSettingsDiv.Visible = False
            ElseIf CurrentNodeType = NodeType.Item Or CurrentNodeType = NodeType.Accessory Then
                ItemInfoDiv.Visible = True
                PropertiesDiv.Visible = True
                FolderDiv.Visible = False
                ItemDiv.Visible = True
                ItemSettingsDiv.Visible = True
                AccessoryDiv.Visible = (CurrentNodeType = NodeType.Item)
                ItemText = CStr(IIf(CurrentNodeType = NodeType.Item, "Item", "Item Accessory"))
            Else
                ItemInfoDiv.Visible = False
                PropertiesDiv.Visible = False
                FolderDiv.Visible = False
                ItemDiv.Visible = False
                ItemSettingsDiv.Visible = False
            End If

            If Not FolderDiv.Visible And Not ItemDiv.Visible Then
                'a node is not selected
                btnSave.Visible = False
                btnSave2.Visible = False
                btnSaveNext2.Visible = False
                btnCancel.Visible = False
                btnCancel2.Visible = False
                btnDelete2.Visible = False
                lblActionTitle.Visible = False
            Else
                btnSave.Visible = False
                btnCancel.Visible = False

                btnSaveNext2.Visible = (Action = PageAction.Add)
                btnSave2.Visible = (Action <> PageAction.View)
                btnCancel2.Visible = (Action <> PageAction.View)
                btnDelete2.Visible = (Action = PageAction.Update)
                lblActionTitle.Visible = True
                If FolderDiv.Visible Then
                    If Action = PageAction.Add Then
                        lblActionTitle.Text = "Create New Folder"
                    ElseIf Action = PageAction.Update Then
                        lblActionTitle.Text = "Update Folder Information"
                    ElseIf Action = PageAction.Copy Then
                        lblActionTitle.Text = "Copy Folder Information"
                    ElseIf Action = PageAction.View Then
                        lblActionTitle.Text = "Foder Information"
                    End If
                ElseIf ItemDiv.Visible Then
                    If Action = PageAction.Add Then
                        lblActionTitle.Text = "Create New " & ItemText
                    ElseIf Action = PageAction.Update Then
                        lblActionTitle.Text = "Update " & ItemText & " Information"
                    ElseIf Action = PageAction.Copy Then
                        lblActionTitle.Text = "Copy " & ItemText & " Information"
                    ElseIf Action = PageAction.View Then
                        lblActionTitle.Text = ItemText & " Information"
                    End If
                End If
            End If

            'if we're copying a node, disable all controls on the page except the 'new parent id' node
            UpdateControlMode(Action = PageAction.Copy Or Action = PageAction.View)

        End Sub

        Private Sub UpdateControlMode(ByVal isReadOnly As Boolean)

            'Item Panel
            ItemCode.ReadOnly = True    'system assigned, never changeable by the user
            VendorCode.ReadOnly = isReadOnly
            ItemDescription.ReadOnly = isReadOnly
            ItemPosition.ReadOnly = isReadOnly
            ItemParentNode.ReadOnly = (Action = PageAction.Add)
            Units.ReadOnly = isReadOnly
            Price.ReadOnly = isReadOnly
            RemUnits.ReadOnly = isReadOnly
            ElecUnits.ReadOnly = isReadOnly
            PlumUnits.ReadOnly = isReadOnly
            TinUnits.ReadOnly = isReadOnly
            DesignUnits.ReadOnly = isReadOnly
            RateDesc.ReadOnly = isReadOnly
            LaborNotes.ReadOnly = isReadOnly
            LaborDescription.ReadOnly = isReadOnly
            Bullet1.ReadOnly = isReadOnly
            Bullet2.ReadOnly = isReadOnly
            Bullet3.ReadOnly = isReadOnly
            Bullet4.ReadOnly = isReadOnly
            Bullet5.ReadOnly = isReadOnly
            Bullet6.ReadOnly = isReadOnly
            Vendors.Enabled = Not isReadOnly
            Classes.ReadOnly = isReadOnly

            'ImagePath.Enabled = Not isReadOnly
            btnUploadImage.Enabled = Not isReadOnly

            DocumentChoice.Enabled = Not isReadOnly
            DocumentPath.Enabled = Not isReadOnly
            btnUploadDocument.Enabled = Not isReadOnly

            XGrid.Enabled = Not isReadOnly

            'Folder Panel
            FolderName.ReadOnly = isReadOnly
            FolderPosition.ReadOnly = isReadOnly
            FolderParentNode.ReadOnly = (Action = PageAction.Add) Or (Mode = AdminView.ItemAccessory)
            FolderPrefix.ReadOnly = True
        End Sub

        Private Sub DatabindUnits()
            Dim Collection As EntityCollection(Of UnitEntity) = _BaseClassManager.UnitList("Select")

            Units.DataSource = Collection
            Units.DataTextField = "Name"
            Units.DataValueField = "UnitID"
            Units.DataBind()
        End Sub

        Private Sub DatabindVendors()
            Dim Collection As EntityCollection(Of VendorEntity) = _BaseClassManager.VendorList("Select")

            Vendors.DataSource = Collection
            Vendors.DataTextField = "Name"
            Vendors.DataValueField = "VendorID"
            Vendors.DataBind()
        End Sub

        Private Sub DatabindItemClasss()
            Dim Collection As EntityCollection(Of ItemClassEntity) = _ItemManager.ItemClassList("Select")

            Classes.DataSource = Collection
            Classes.DataTextField = "Name"
            Classes.DataValueField = "ItemClassID"
            Classes.DataBind()
        End Sub

        Private Sub DataBindImages()
            Dim Collection As EntityCollection(Of ImageEntity) = _ItemManager.ImageList(ItemId.GetValueOrDefault())

            Images.DataSource = Collection
            Images.DataKeyField = "ImageID"
            Images.DataBind()

            ImageDiv.Visible = (Collection.Count > 0)
        End Sub

        Private Sub DataBindDocuments()
            Dim Collection As EntityCollection(Of DocumentEntity) = _ItemManager.DocumentList(ItemId.GetValueOrDefault())

            Documents.DataSource = Collection
            Documents.DataKeyField = "DocumentID"
            Documents.DataBind()

            DocumentDiv.Visible = (Collection.Count > 0)
        End Sub

        Private Sub DataBindAccessories(ByVal NodeID As Integer, Optional ByVal ItemID As Integer = -1)
            Dim Collection As EntityCollection(Of NodeItemViewEntity) = _ItemManager.AvailableItemAccessoryList(NodeID)

            XGrid.DataSource = Collection
            XGrid.DataBind()

            If Collection.Count > 0 And ItemID <> -1 Then
                'check the item accessories already associated with items in the grid
                Dim ItemAccessories As EntityCollection(Of ItemAccessoryEntity) = _ItemManager.ItemAccessoryList(ItemID)
                For Each ItemAccessory As ItemAccessoryEntity In ItemAccessories
                    Dim Index As Integer = 0
                    For Each Row As GridViewRow In XGrid.Rows
                        Dim C As CheckBox = CType(Row.FindControl("chkSelect"), CheckBox)
                        If ItemAccessory.AccessoryId = CInt(XGrid.DataKeys(Index).Value) Then
                            C.Checked = True
                        End If
                        Index += 1
                    Next
                Next
            End If

        End Sub

        Private Sub ShowError(ByVal Message As String)
            ErrorPanel.Visible = True
            ErrorMessage.InnerHtml = Message
        End Sub

        Private Sub ShowSuccess(ByVal Message As String)
            SuccessPanel.Visible = True
            SuccessPanel.InnerHtml = Message
        End Sub

        Private Function GetImagePath(ByVal FileName As String) As String
            Return PRODUCT_IMAGE_PATH & FileName
        End Function

        Private Function FindControlRecursive(ByVal Root As Control, ByVal ClientID As String) As Control
            If Root.ClientID = ClientID Then
                Return Root
            End If
            'Debug.WriteLine(Root.ClientID)

            For Each Ctl As Control In Root.Controls
                Dim FoundCtl As Control = FindControlRecursive(Ctl, ClientID)
                If Not IsNothing(FoundCtl) Then
                    Return FoundCtl
                End If
            Next

            Return Nothing
        End Function

#End Region


        'Protected Sub UploadImage_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles UploadImage.Click
        '    If Not BrowseImage1.HasFile Then
        '        '-- Missing file selection
        '        'Message.Text = "Please choose a file to upload"
        '    Else
        '        If InStr(UCase(BrowseImage1.FileName), ".JPG") = 0 Then
        '            '-- Selection of non-JPG file
        '            'Message.Text = "You can upload only JPG files"
        '        Else
        '            If BrowseImage1.PostedFile.ContentLength > 100000 Then
        '                '-- File too large
        '                'Message.Text = "Uploaded file size must be less than 100 KB"
        '            Else
        '                '-- File upload
        '                Dim SavePath As String = Server.MapPath("../Images/Products/") & BrowseImage1.FileName
        '                BrowseImage1.SaveAs(SavePath)
        '                'Message.Text = "<b>File Uploaded</b><br/>"
        '                'Message.Text &= "File Name: " & BrowseImage1.FileName & "<br/>"
        '                'Message.Text &= "File Size: " & BrowseImage1.PostedFile.ContentLength & " bytes<br/>"
        '            End If
        '        End If
        '    End If
        'End Sub

        Private Sub SaveImageData()
            Dim ImageID As Integer
            Dim Image As ImageEntity
            Dim ImageList As New EntityCollection(Of ImageEntity)(New ImageEntityFactory())

            'TODO: Validate input

            Dim I As Integer = 0
            For Each Item As DataListItem In Images.Items
                Dim X As TextBox = CType(Item.FindControl("Position"), TextBox)
                ImageID = CInt(Images.DataKeys.Item(I))
                Image = New ImageEntity(ImageID)
                Image.IsNew = False
                Image.SeqNo = CInt(X.Text)
                ImageList.Add(Image)
                I += 1
            Next
            _ItemManager.ImageListUpdate(ImageList)

            DataBindImages()
        End Sub

        Private Sub SaveDocumentData()
            Dim DocumentID As Integer
            Dim Document As DocumentEntity
            Dim DocumentList As New EntityCollection(Of DocumentEntity)(New DocumentEntityFactory())

            'TODO: Validate input

            Dim I As Integer = 0
            For Each Item As DataListItem In Documents.Items
                Dim X As TextBox = CType(Item.FindControl("Position"), TextBox)
                DocumentID = CInt(Documents.DataKeys.Item(I))
                Document = New DocumentEntity(DocumentID)
                Document.IsNew = False
                Document.SeqNo = CInt(X.Text)
                DocumentList.Add(Document)
                I += 1
            Next
            _ItemManager.DocumentListUpdate(DocumentList)

            DataBindDocuments()
        End Sub

        'This function creates the Thumbnail image and returns the image created in Byte() format/
        Private Function createThumnail(ByVal ImageStream As Stream, ByVal tWidth As Double, ByVal tHeight As Double) As Byte()
            Dim g As System.Drawing.Image = System.Drawing.Image.FromStream(ImageStream)
            Dim thumbSize As New Size()
            thumbSize = NewthumbSize(g.Width, g.Height, tWidth, tHeight)
            Dim imgOutput As New Bitmap(g, thumbSize.Width, thumbSize.Height)
            Dim imgStream As New MemoryStream()
            Dim thisFormat As ImageFormat = g.RawFormat
            imgOutput.Save(imgStream, thisFormat)
            Dim imgbin(CInt(imgStream.Length)) As Byte
            imgStream.Position = 0
            Dim n As Int32 = imgStream.Read(imgbin, 0, imgbin.Length)
            g.Dispose()
            imgOutput.Dispose()
            Return imgbin
        End Function

        Private Function NewthumbSize(ByVal currentwidth As Double, ByVal currentheight As Double, ByVal newWidth As Double, ByVal newHeight As Double) As Size
            ' Calculate the Size of the New image
            Dim tempMultiplier As Double

            If currentheight > currentwidth Then ' portrait
                tempMultiplier = newHeight / currentheight
            Else
                tempMultiplier = newWidth / currentwidth
            End If

            Dim NewSize As New Size(CInt(currentwidth * tempMultiplier), CInt(currentheight * tempMultiplier))
            Return NewSize
        End Function

        Public Function GetImageHtml(ByVal ItemID As String) As String
            Dim Html As New StringBuilder()
            Dim Image As ImageEntity = _ItemManager.ImageSelectByItem(CInt(ItemID))

            If Not IsNothing(Image) Then
                Html.Append(String.Format("<span onclick=""window.open('../WebPages/GetData.aspx?ItemID={0}')"",'ImgL','toolbar=no,locations=no,directories=no,status=no,menubar=no,width=500,height=500');"">", ItemID))
                Html.Append(String.Format("<img src='../WebPages/GetData.aspx?ItemID={0}&DoThumb=50' />", ItemID))
                Html.Append("</span>")
            Else
                Return "Image Not Available"
            End If

            Return Html.ToString()
        End Function

    End Class

End Namespace
