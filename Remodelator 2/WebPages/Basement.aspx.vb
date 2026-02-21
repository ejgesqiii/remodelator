Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Basement
        Inherits PageBase

        Dim _TreeManager As New TreeManager()

#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then

            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            Dim RootNodeID As Nullable(Of Integer) = Nothing
            Dim LineID As Nullable(Of Integer) = Nothing

            SetVisibility()

            If Not Page.IsPostBack Then
                If IsAuthenticated Then
                    lblTitle.InnerText = Utilities.GetItemBreadcrumb(Master.MainMenu)
                    Dim QueryVal As String = Request.QueryString("NodeID")
                    If QueryVal <> "" Then
                        RootNodeID = CInt(QueryVal)
                    End If
                    QueryVal = Request.QueryString("LineID")
                    If QueryVal <> "" Then
                        LineID = CInt(QueryVal)
                    End If
                    ucItemBrowser.RootNodeID = RootNodeID
                    ucItemBrowser.LineID = LineID
                End If
            End If

            JobBanner.InnerHtml = Utilities.GetEstimateBanner(Estimate, True)
            JobBanner.Visible = (JobBanner.InnerHtml <> "")
            Me.Title = FormatPageTitle("Basement")
        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub SetVisibility()

            If IsAuthenticated Then
                Master.ColumnCount = 1
                ValidUser.Visible = True
                NoUser.Visible = False
            Else
                Master.ColumnCount = 2
                ValidUser.Visible = False
                NoUser.Visible = True
            End If

        End Sub

#End Region

    End Class

End Namespace
