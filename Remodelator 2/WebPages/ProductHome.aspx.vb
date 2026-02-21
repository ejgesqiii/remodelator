Imports System.Data
Imports System.Diagnostics
Imports System.Collections.Generic
Imports System.Text

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class ProductHome
        Inherits PageBase

        Dim _BaseClassManager As New BaseClassManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If

            If Not Page.IsPostBack Then

            End If

            Master.ColumnCount = 1


            If Not Page.IsPostBack Then
                Link1.InnerHtml = LinkHTML("Bath")
                Link2.InnerHtml = LinkHTML("Kitchen")
                Link3.InnerHtml = LinkHTML("Attic")
                Link4.InnerHtml = LinkHTML("Basement")
                Link5.InnerHtml = LinkHTML("Ext. Structure")
                Link6.InnerHtml = LinkHTML("Landscaping")
            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

        End Sub

#End Region

#Region "Control Events"


#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Function LinkHTML(ByVal Name As String) As String
            Dim Tab As TabEntity = _BaseClassManager.TabSelect(Name)
            Dim Text As String = "<a href=""{0}.aspx{1}""><div class=""Block"">{0}</div></a>"
            Dim QueryStr As String = ""
            If Not IsNothing(Tab.NodeId) Then
                QueryStr = "?NodeID=" & Tab.NodeId.GetValueOrDefault()
            End If
            Return String.Format(Text, Tab.NavigateUrl, QueryStr)
        End Function


#End Region


    End Class

End Namespace
