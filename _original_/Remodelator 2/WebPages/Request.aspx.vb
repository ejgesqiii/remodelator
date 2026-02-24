Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Request
        Inherits PageBase

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
            If IsNothing(Subscriber) Then
                'TODO: This saves an exception from occurring, however the client doesn't see the redirect. So, if a user is editing a proposal item and their
                'session times out, then they won't see the item price change
                Response.Redirect("Home.aspx", True)
            End If

            Dim SubscriberID As Integer = Subscriber.SubscriberId

            If Not String.IsNullOrEmpty(Request.QueryString("DoPrice")) Then
                Dim Prefix As String = Request.QueryString("Prefix")
                Dim Price As String = "$0.00"
                Dim QueryStr As String = HttpUtility.UrlDecode(Request.QueryString("data"))
                Dim data() As String = Regex.Split(QueryStr, ":_:")

                If data.Length <> 10 Or QueryStr = ":_::_::_::_::_::_::_::_::_::_:" Then
                    'something isn't right with the input the user submitted, or 
                    'user blanked all fields and tabbed causing a search for all data
                    'Response.ContentType = "text/xml"
                    Response.Write(Price)
                    Exit Sub
                End If

                Dim Qty, PartPrice, RemodelerUnits, ElectricianUnits, PlumberUnits, TinnerUnits, DesignUnits, MaterialMarkup, LaborMarkup, SubMarkup As Decimal

                If IsPositiveNumber(data(0)) Then
                    Qty = CDec(data(0))
                End If
                If IsPositiveNumber(data(1)) Then
                    PartPrice = CDec(data(1))
                End If
                If IsPositiveNumber(data(2)) Then
                    RemodelerUnits = CDec(data(2))
                End If
                If IsPositiveNumber(data(3)) Then
                    ElectricianUnits = CDec(data(3))
                End If
                If IsPositiveNumber(data(4)) Then
                    PlumberUnits = CDec(data(4))
                End If
                If IsPositiveNumber(data(5)) Then
                    TinnerUnits = CDec(data(5))
                End If
                If IsPositiveNumber(data(6)) Then
                    DesignUnits = CDec(data(6))
                End If
                If IsPositiveNumber(data(7)) Then
                    MaterialMarkup = CDec(data(7))
                End If
                If IsPositiveNumber(data(8)) Then
                    LaborMarkup = CDec(data(8))
                End If
                If IsPositiveNumber(data(9)) Then
                    SubMarkup = CDec(data(9))
                End If

                Dim ItemManager As New ItemManager()
                Dim UserManager As New UserManager()
                Dim Subscriber As SubscriberEntity = UserManager.SubscriberSelect(SubscriberID)

                If MaterialMarkup = 0 And LaborMarkup = 0 And SubMarkup = 0 Then
                    'we're on the admin page - use the subscriber's markup values
                    Price = Format(ItemManager.ItemPrice(PartPrice, PlumberUnits, TinnerUnits, ElectricianUnits, DesignUnits, RemodelerUnits, _
                        Subscriber, Nothing), "$0.00")
                Else
                    Price = Format(ItemManager.ItemPrice(PartPrice, PlumberUnits, TinnerUnits, ElectricianUnits, DesignUnits, RemodelerUnits, _
                        Subscriber, Estimate, Qty, MaterialMarkup, LaborMarkup, SubMarkup), "$0.00")
                End If

                'Response.ContentType = "text/xml"
                'Response.Write(Price)
                Dim JSON As New StringBuilder()
                JSON.Append("{")
                JSON.Append(String.Format("""Prefix"":""{0}"",""Price"":""{1}""", Prefix, Price))
                JSON.Append("}")
                Response.Write(JSON.ToString())
            ElseIf Not String.IsNullOrEmpty(Request.QueryString("UpdatePrice")) Then
                Dim LineID As Integer = CInt(Request.QueryString("LineID"))
                Dim Price As String = "$0.00"
                Dim QueryStr As String = HttpUtility.UrlDecode(Request.QueryString("data"))
                Dim data() As String = Regex.Split(QueryStr, ":_:")

                If data.Length <> 7 Or QueryStr = ":_::_::_::_::_::_::_:" Then
                    'something isn't right with the input the user submitted, or 
                    'user blanked all fields and tabbed causing a search for all data
                    'Response.ContentType = "text/xml"
                    Response.Write(Price)
                    Exit Sub
                End If

                Dim Qty, PartPrice, RemodelerUnits, ElectricianUnits, PlumberUnits, TinnerUnits, DesignUnits As Decimal

                If IsPositiveNumber(data(0)) Then
                    Qty = CDec(data(0))
                End If
                If IsPositiveNumber(data(1)) Then
                    PartPrice = CDec(data(1))
                End If
                If IsPositiveNumber(data(2)) Then
                    RemodelerUnits = CDec(data(2))
                End If
                If IsPositiveNumber(data(3)) Then
                    ElectricianUnits = CDec(data(3))
                End If
                If IsPositiveNumber(data(4)) Then
                    PlumberUnits = CDec(data(4))
                End If
                If IsPositiveNumber(data(5)) Then
                    TinnerUnits = CDec(data(5))
                End If
                If IsPositiveNumber(data(6)) Then
                    DesignUnits = CDec(data(6))
                End If

                Dim ItemManager As New ItemManager()
                Dim UserManager As New UserManager()

                Dim Subscriber As SubscriberEntity = UserManager.SubscriberSelect(SubscriberID)

                If Not IsNothing(Subscriber) Then
                    Price = Format(ItemManager.ItemPrice(PartPrice, PlumberUnits, TinnerUnits, ElectricianUnits, DesignUnits, RemodelerUnits, Subscriber, Nothing, Qty), "$0.00")
                End If

                Dim _OrderManager As New OrderManager()
                Dim OrderItem As OrderItemEntity = _OrderManager.OrderItemSelect(LineID)

                OrderItem.Qty = Qty
                OrderItem.ExtPrice = Price
                _OrderManager.OrderItemUpdate(OrderItem)

                'Calculate the new order total
                Estimate.OrderTotal = _OrderManager.CalculateOrderTotal(Estimate.OrderId)
                _OrderManager.OrderUpdate(Estimate)
                Response.Write(" ")
            Else
                Dim NodeID As Integer = CInt(Request.QueryString("ID"))

                Dim TreeView1 As TreeView = Utilities.GetTreeBranch(Mode, NodeID)

                If IsNothing(TreeView1) Then
                    TreeView1 = New TreeView()
                End If

                Response.Clear()
                Response.ClearHeaders()
                Response.AddHeader("Pragma", "no-cache")
                Response.Expires = -1
                Response.ContentType = "text/xml"
                Response.Write(TreeView1.GetXml())
            End If
        End Sub


    End Class

End Namespace