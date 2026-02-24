Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses


Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Test3
        Inherits System.Web.UI.Page

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If (Not IsPostBack) Then
                Dim ds As System.Data.DataSet = New System.Data.DataSet()
                ds.ReadXml(Server.MapPath("products.xml"))
                Repeater1.DataSource = ds
                Repeater1.DataBind()
                PopulateProductInfo("CasioS100")
            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            Debug.WriteLine("In PreRender()")
        End Sub

        Private Sub Callback1_Callback(ByVal sender As Object, ByVal e As ComponentArt.Web.UI.CallBackEventArgs) Handles Callback1.Callback

            Debug.WriteLine("In Callback1()")

            lblTicks.Text = "Current ticks: " & DateTime.Now.Ticks.ToString
            lblTicks.RenderControl(e.Output)

        End Sub

        Private Sub PopulateProductInfo(ByVal ProductId As String)
            Dim dr As System.Data.DataRow = getDataRow(ProductId)
            If Not dr Is Nothing Then
                imgProductImage.ImageUrl = "../images/tests/" & dr("Image").ToString()
                lblProductTitle.Text = dr("Title").ToString()
                lblProductTagLine.Text = dr("TagLine").ToString()
                lblListPrice.Text = dr("ListPrice").ToString()
                lblOurPrice.Text = dr("OurPrice").ToString()
                lblSavings.Text = dr("Savings").ToString()
                lblAvailability.Text = dr("Availability").ToString()
                lblProductInfo.Text = dr("ProductInfo").ToString()
            End If
        End Sub

        Private Function getDataRow(ByVal ProductId As String)  As System.Data.DataRow
            Dim ds As System.Data.DataSet = New System.Data.DataSet()
            ds.ReadXml(Server.MapPath("products.xml"))

            For Each dr As System.Data.DataRow In ds.Tables(0).Rows
                If dr("ProductId").ToString() = ProductId Then
                    Return dr
                End If
            Next dr
            Return Nothing
        End Function

        Private Sub CallBack2_Callback(ByVal sender As Object, ByVal e As ComponentArt.Web.UI.CallBackEventArgs) Handles CallBack2.Callback
            Debug.WriteLine("In Callback1()")
            PopulateProductInfo(e.Parameter)
            PlaceHolder1.RenderControl(e.Output)
        End Sub

    End Class


End Namespace
