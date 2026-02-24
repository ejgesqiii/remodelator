Imports System.Diagnostics
Imports System.Collections.Generic
Imports System.Drawing

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class LaborSheet
        Inherits PageBase

        Dim _TreeManager As New TreeManager()
        Dim _OrderManager As New OrderManager()
        Dim _AltRowIndex As Integer = -1

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If User.Identity.IsAuthenticated Then
                If Not Page.IsPostBack Then
                    BindDataGrid()
                End If
            End If
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            'JobBanner.InnerHtml = Utilities.GetEstimateBanner(Estimate, True)
            'JobBanner.Visible = (JobBanner.InnerHtml <> "")

        End Sub

#End Region

#Region "Control Events"

        Protected Sub LaborGrid_RowDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewRowEventArgs) Handles LaborGrid.RowDataBound
            'massage the grid contents
            If e.Row.RowType = DataControlRowType.DataRow Then
                Dim OrderItem As OrderItemDetailViewEntity = CType(e.Row.DataItem, OrderItemDetailViewEntity)
                If OrderItem.LineId < 0 Then
                    e.Row.HorizontalAlign = HorizontalAlign.Left
                    e.Row.Font.Bold = True
                    If OrderItem.LineId = -3 Then
                        'totals row 
                        e.Row.Width = New Unit("100%")
                        e.Row.Cells(0).HorizontalAlign = HorizontalAlign.Right
                    Else
                        e.Row.Cells.RemoveAt(6)
                        e.Row.Cells.RemoveAt(5)
                        e.Row.Cells.RemoveAt(4)
                        e.Row.Cells.RemoveAt(3)
                        e.Row.Cells.RemoveAt(1)
                        e.Row.Cells.RemoveAt(0)
                        e.Row.Cells(0).Text = OrderItem.Name
                        e.Row.Cells(0).ColumnSpan = 6
                        e.Row.Cells(0).HorizontalAlign = HorizontalAlign.Left
                        e.Row.Font.Bold = True
                        If OrderItem.LineId = -2 Then
                            'group row
                            e.Row.BackColor = Color.LightSlateGray
                            e.Row.ForeColor = Color.White
                        ElseIf OrderItem.LineId = -1 Then
                            'parent row
                            e.Row.BackColor = Color.SkyBlue
                            e.Row.ForeColor = Color.Black
                        End If
                    End If
                    _AltRowIndex = -1
                Else
                    _AltRowIndex = _AltRowIndex + 1
                    If _AltRowIndex Mod 2 = 1 Then
                        'change row color
                        e.Row.Attributes("class") = "AltRow"
                    End If
                    If OrderItem.Inactive Then
                        'display font in red to indicate item is no longer available
                        e.Row.ForeColor = Color.Red
                    End If
                End If
            End If

        End Sub

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub BindDataGrid()
            Dim Data As EntityCollection(Of OrderItemDetailViewEntity) = _OrderManager.OrderItemDetailViewList(Estimate.OrderId, GridType.Labor)
            'add dummy rows for the header columns
            LaborGrid.DataSource = Data
            LaborGrid.DataBind()
        End Sub

#End Region

        'Protected Sub btnPrint_Command(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.CommandEventArgs) Handles btnPrint.Command

        '    'TODO: This is flawed...if the user cancels the print operation, we'll still charge their credit card!
        '    'Lock the newly printed order, don't select any order, and return to the home page
        '    'TODO: Charge user's credit card
        '    _OrderManager.OrderLock(Estimate.OrderId)
        '    Estimate = Nothing
        '    Response.Redirect("SubscriberHome.aspx")
        'End Sub
    End Class

End Namespace
