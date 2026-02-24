Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Test
        Inherits System.Web.UI.Page

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then

                ErrorMsg.text = ""
            End If


        End Sub



        Protected Sub btnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSave.Click
            Debug.WriteLine("Clicked Save!")
            If Not IsNumeric(txtData.Text) Then
                ErrorMsg.Text = "Please enter a valid number!"
            End If
            ClientScript.RegisterStartupScript(Me.GetType(), "Test", "<script language='javascript'>Dialog1.Show();</script>")

        End Sub
    End Class


End Namespace
