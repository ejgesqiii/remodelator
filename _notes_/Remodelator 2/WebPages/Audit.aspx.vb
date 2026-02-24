Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Audit
        Inherits PageBase

        Dim _ActMan As New ActivityManager()
        Dim _UserMan As New UserManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not User.Identity.IsAuthenticated Then
                Response.Redirect("Home.aspx", True)
            End If

            Master.ColumnCount = 1

            If Not Page.IsPostBack Then

                UserName.DataSource = _UserMan.SubscriberList("<All>", True)
                UserName.DataTextField = "FullName"
                UserName.DataValueField = "SubscriberID"
                UserName.DataBind()

                'StartDate.Text = DateTime.Today
                'EndDate.Text = DateTime.Today

                Search_Click(Nothing, Nothing)

            End If
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            Me.Title = FormatPageTitle("Audit Trail")
        End Sub

#End Region

#Region "Control Events"

        Protected Sub Search_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles Search.Click

            Dim UserCriteria As Nullable(Of Integer)
            Dim Result As Date
            Dim StartDateCriteria, EndDateCriteria As Nullable(Of DateTime)

            If UserName.SelectedIndex > 0 Then
                UserCriteria = CInt(UserName.SelectedValue)
            End If
            If DateTime.TryParse(StartDate.Text, Result) Then
                StartDateCriteria = Result
            End If
            If DateTime.TryParse(EndDate.Text, Result) Then
                EndDateCriteria = Result.AddDays(1)
            End If

            AuditGrid.DataSource = _ActMan.AuditLogList(UserCriteria, StartDateCriteria, EndDateCriteria)
            AuditGrid.DataBind()

        End Sub

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub SetVisibility()

        End Sub

#End Region

    End Class

End Namespace
