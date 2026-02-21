Imports System.Data
Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses
Imports SD.LLBLGen.Pro.ORMSupportClasses
Imports ComponentArt.Web.UI
Namespace Remodelator
    Partial Class SubscriberHome
        Inherits PageBase
        Dim _TreeManager As New TreeManager()
        Dim _OrderManager As New OrderManager()
        Dim _UserManager As New UserManager()
        Dim _HasOpenEstimates As Boolean
#Region "Public Properties"
#End Region
#Region "Page Events"
        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If
            If Not Page.IsPostBack Then
                Master.ColumnCount = 1
                btnEditProfile.Visible = True
                DataBindEstimates()
            End If
        End Sub
        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            EditProfileDiv.Visible = (ucEditProfile.ControlMode = PageMode.Edit)
            btnEditProfile.Visible = Not EditProfileDiv.Visible
            SubscriberRollup.Visible = Not EditProfileDiv.Visible
            MiscDiv.Visible = Not EditProfileDiv.Visible
            If Not Page.IsPostBack Then
            End If
            'btnCreate.Visible = Not _UserManager.SubscriberHasOpenEstimate(Subscriber.SubscriberId)
            btnCreate.Visible = True
            JobBanner.InnerHtml = Utilities.GetEstimateBanner(Estimate, True)
            JobBanner.Visible = (JobBanner.InnerHtml <> "")
            Me.Title = FormatPageTitle("Subscriber Dashboard")
        End Sub
#End Region
#Region "Control Events"
        Protected Sub EditProfile_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnEditProfile.Click
            EditProfileDiv.Visible = True
            btnEditProfile.Visible = False
            ucEditProfile.ControlMode = PageMode.Edit
            ucEditProfile.Reload = True
            MiscDiv.Visible = False
        End Sub
        Protected Sub btnCreate_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnCreate.Click
            Response.Redirect("Estimate2.aspx", True)
        End Sub
#End Region
#Region "Public Helpers"
#End Region
#Region "Private Helpers"
        Private Sub DataBindEstimates()
            _HasOpenEstimates = _UserManager.SubscriberHasOpenEstimate(Subscriber.SubscriberId)
            Dim Estimates As EntityCollection(Of OrderEntity) = _OrderManager.OrderList(Subscriber.SubscriberId)
            EstimateList.DataSource = Estimates
            EstimateList.DataBind()
            EstimateList.Visible = (Estimates.Count > 0)
            NoEstimates.Visible = Not EstimateList.Visible
            DataBindEstimateTemplates()
        End Sub
        Private Sub DataBindEstimateTemplates()
            _HasOpenEstimates = _UserManager.SubscriberHasOpenEstimate(Subscriber.SubscriberId)
            Dim EstimateTemplates As EntityCollection(Of OrderEntity) = _OrderManager.OrderTemplateList(Subscriber.SubscriberId)
            EstimateTemplateList.DataSource = EstimateTemplates
            EstimateTemplateList.DataBind()
            EstimateTemplateList.Visible = (EstimateTemplates.Count > 0)
            NoEstimateTemplates.Visible = Not EstimateTemplateList.Visible
        End Sub
#End Region
        Protected Sub EstimateList_ItemCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.RepeaterCommandEventArgs) Handles EstimateList.ItemCommand
            Dim OrderID As Integer
            If e.CommandName = "Edit" Then
                OrderID = CInt(e.CommandArgument)
                Response.Redirect("Estimate2.aspx?ID=" & OrderID)
            ElseIf e.CommandName = "Version" Then
                OrderID = CInt(e.CommandArgument)
                _OrderManager.OrderVersion(OrderID)
                DataBindEstimates()
            ElseIf e.CommandName = "Lock" Then
                OrderID = CInt(e.CommandArgument)
                _OrderManager.OrderLock(OrderID)
                DataBindEstimates()
            ElseIf e.CommandName = "Delete" Then
                OrderID = CInt(e.CommandArgument)
                _OrderManager.OrderDelete(OrderID)
                'if we just deleted the currently active estimate, clear it!
                If Not IsNothing(Estimate) AndAlso Estimate.OrderId = OrderID Then
                    Estimate = Nothing
                End If
                DataBindEstimates()
            ElseIf e.CommandName = "Template" Then
                OrderID = CInt(e.CommandArgument)
                _OrderManager.OrderMakeTemplate(OrderID)
                DataBindEstimates()
            Else
                'do nothing
            End If
        End Sub
        Protected Sub EstimateList_ItemDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.RepeaterItemEventArgs) Handles EstimateList.ItemDataBound
            If e.Item.ItemType = ListItemType.Item Or e.Item.ItemType = ListItemType.AlternatingItem Then
                Dim Order As OrderEntity = CType(e.Item.DataItem, OrderEntity)
                Dim btnEdit As LinkButton = CType(e.Item.FindControl("btnEdit"), LinkButton)
                Dim btnLock As LinkButton = CType(e.Item.FindControl("btnLock"), LinkButton)
                Dim btnDelete As LinkButton = CType(e.Item.FindControl("btnDelete"), LinkButton)
                Dim btnTemplate As LinkButton = CType(e.Item.FindControl("btnTemplate"), LinkButton)
                Dim btnVersion As LinkButton = CType(e.Item.FindControl("btnVersion"), LinkButton)
                btnEdit.CommandName = "Edit"
                btnEdit.CommandArgument = Order.OrderId
                'btnLock.CommandName = "Lock"
                'btnLock.CommandArgument = Order.OrderId
                btnDelete.CommandName = "Delete"
                btnDelete.CommandArgument = Order.OrderId
                btnTemplate.CommandName = "Template"
                btnTemplate.CommandArgument = Order.OrderId
                btnVersion.CommandName = "Version"
                btnVersion.CommandArgument = Order.OrderId
                If Order.Locked Then
                    btnEdit.Visible = False
                    btnDelete.Visible = False
                    btnLock.Visible = False
                    'btnVersion.Visible = False
                End If

                btnVersion.Visible = Not _HasOpenEstimates
            End If
        End Sub
        Protected Sub EstimateTemplateList_ItemCommand(ByVal source As Object, ByVal e As System.Web.UI.WebControls.RepeaterCommandEventArgs) Handles EstimateTemplateList.ItemCommand
            Dim OrderID As Integer
            If e.CommandName = "Edit" Then
                OrderID = CInt(e.CommandArgument)
                Response.Redirect("Estimate2.aspx?ID=" & OrderID, True)
            ElseIf e.CommandName = "Delete" Then
                OrderID = CInt(e.CommandArgument)
                _OrderManager.OrderDelete(OrderID)
                If Not IsNothing(Estimate) AndAlso Estimate.OrderId = OrderID Then
                    Estimate = Nothing
                End If
                DataBindEstimates()
            ElseIf e.CommandName = "Estimate" Then
                OrderID = CInt(e.CommandArgument)
                _OrderManager.OrderMakeFromTemplate(OrderID)
                DataBindEstimates()
            Else
                'do nothing
            End If
        End Sub
        Protected Sub EstimateTemplateList_ItemDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.RepeaterItemEventArgs) Handles EstimateTemplateList.ItemDataBound
            If e.Item.ItemType = ListItemType.Item Or e.Item.ItemType = ListItemType.AlternatingItem Then
                Dim Order As OrderEntity = CType(e.Item.DataItem, OrderEntity)
                Dim btnEdit As LinkButton = CType(e.Item.FindControl("btnEdit"), LinkButton)
                Dim btnDelete As LinkButton = CType(e.Item.FindControl("btnDelete"), LinkButton)
                Dim btnEstimate As LinkButton = CType(e.Item.FindControl("btnEstimate"), LinkButton)
                btnEdit.CommandName = "Edit"
                btnEdit.CommandArgument = Order.OrderId
                btnDelete.CommandName = "Delete"
                btnDelete.CommandArgument = Order.OrderId
                btnEstimate.CommandName = "Estimate"
                btnEstimate.CommandArgument = Order.OrderId
                If Order.Locked Then
                    btnEdit.Visible = False
                End If
                btnEstimate.Visible = Not _HasOpenEstimates
            End If
        End Sub
    End Class
End Namespace
