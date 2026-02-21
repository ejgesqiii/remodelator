Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Request2
        Inherits PageBase

        Dim _OrderManager As New OrderManager()

        Public Property LineID() As Integer
            Get
                Dim o As Object = ViewState("LineID")
                If IsNothing(o) Then
                    Return 0
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("LineID") = value
            End Set
        End Property

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
            LineID = CInt(Page.Request.Form("LineID"))
            LoadEditPanel()
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            Name.ReadOnly = True
            ExtPrice.ReadOnly = True
            Qty.ReadOnly = False
            RemUnits.ReadOnly = False
            ElecUnits.ReadOnly = False
            PlumUnits.ReadOnly = False
            TinUnits.ReadOnly = False
            DesignUnits.ReadOnly = False
            Comment.ReadOnly = False

            Dim jsFunctionCall As String = String.Format("GetPrice('{0}')", "")
            Qty.Attributes("onchange") = jsFunctionCall
            RemUnits.Attributes("onchange") = jsFunctionCall
            ElecUnits.Attributes("onchange") = jsFunctionCall
            PlumUnits.Attributes("onchange") = jsFunctionCall
            TinUnits.Attributes("onchange") = jsFunctionCall
            DesignUnits.Attributes("onchange") = jsFunctionCall

            If ErrorPanel.Visible Then
                ExtPrice.Text = "$0.00"
            End If

        End Sub

        Private Sub LoadEditPanel()
            Dim SelectedDetail As OrderItemDetailViewEntity = _OrderManager.OrderItemDetailViewSelect(LineID)

            Name.Text = SelectedDetail.Name
            ExtPrice.Text = Format(SelectedDetail.ExtPrice, "$0.00")
            Qty.Text = SelectedDetail.Qty
            RemUnits.Text = SelectedDetail.RemodelerProdRate
            ElecUnits.Text = SelectedDetail.ElectricianProdRate
            PlumUnits.Text = SelectedDetail.PlumberProdRate
            TinUnits.Text = SelectedDetail.TinnerProdRate
            DesignUnits.Text = SelectedDetail.DesignerProdRate
            Price_val.Value = SelectedDetail.Price
            Comment.Text = SelectedDetail.Comments

        End Sub

    End Class

End Namespace