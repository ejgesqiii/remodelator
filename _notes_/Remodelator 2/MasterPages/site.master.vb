Option Strict On

Imports System.Diagnostics

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class site
        Inherits System.Web.UI.MasterPage

#Region "Properties"

        Property TheSession() As SessionVals
            Get
                Return CType(Session("SessionData"), SessionVals)
            End Get
            Set(ByVal value As SessionVals)
                Session("SessionData") = value
            End Set
        End Property

        '''' <summary>
        '''' The name of the last web page that was visited
        '''' </summary>
        '''' <remarks></remarks>
        'Property LastWebPage() As WebPage
        '    Get
        '        Dim o As Object = Session("LastWebPage")
        '        If IsNothing(o) Then
        '            Return WebPage.Login
        '        Else
        '            Return CType(o, WebPage)
        '        End If
        '    End Get
        '    Set(ByVal value As WebPage)
        '        Session("LastWebPage") = value
        '    End Set
        'End Property

        'This should get set when logging in!
        Public Property Subscriber() As SubscriberEntity
            Get
                Dim o As Object = Session("Subscriber")
                If IsNothing(o) Then
                    Debug.WriteLine("Subscriber not available.")
                    Return Nothing
                Else
                    Return CType(o, SubscriberEntity)
                End If
            End Get
            Set(ByVal value As SubscriberEntity)
                Session("Subscriber") = value
            End Set
        End Property

        ''The location where the Staff is logged in
        'Public Property LoginLocation() As LocationEntity
        '    Get
        '        If IsNothing(LoginInfo) Then
        '            Return Nothing
        '        Else
        '            Return LoginInfo.Location
        '        End If
        '    End Get
        '    Set(ByVal value As LocationEntity)
        '        If IsNothing(LoginInfo) Then
        '            LoginInfo = New LoginInfo()
        '            LoginInfo.Location = value
        '        End If
        '    End Set
        'End Property

        Public Property ColumnCount() As Integer
            Get
                Dim o As Object = ViewState("ColumnCount")
                If IsNothing(o) Then
                    Return 2
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                ViewState("ColumnCount") = value
            End Set
        End Property

        Public Property PageTitle() As String
            Get
                Dim o As Object = ViewState("PageTitle")
                If IsNothing(o) Then
                    Return ""
                Else
                    Return CStr(o)
                End If
            End Get
            Set(ByVal value As String)
                ViewState("PageTitle") = value
            End Set
        End Property

        ''' <summary>
        ''' The tabstrip control that resides in the Tabs user control
        ''' </summary>
        ''' <value></value>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public ReadOnly Property MainMenu() As Menu
            Get
                Return ucTabs.MainMenu
            End Get
        End Property

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            'Page.MaintainScrollPositionOnPostBack = True

            Dim WelcomeMsg As WebControls.LoginName = CType(LoginView1.FindControl("LoginName1"), WebControls.LoginName)
            If Not IsNothing(WelcomeMsg) Then
                WelcomeMsg.FormatString = "Welcome {0}"
            End If

        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

            If ColumnCount = 1 Then
                '1 column
                RightArea.Visible = False
                ContentArea.ColSpan = 2
                ContentArea.Attributes("class") = "OneColumnContent"
            Else
                '2 columns
                RightArea.Visible = True
                ContentArea.ColSpan = 1
                ContentArea.Attributes("class") = "TwoColumnContent"
            End If

            'Temporary for simulation purposes
            Dim TheSession As SessionVals = CType(Session("SessionData"), SessionVals)
            btnLogout.Visible = Page.User.Identity.IsAuthenticated

            If Not String.IsNullOrEmpty(PageTitle) Then
                'FeatureTitle.InnerText = PageTitle
                'ElseIf Not IsNothing(TheSession) Then
                '    If String.IsNullOrEmpty(GetQueryStringValue("Historical")) Then
                '        FeatureTitle.InnerText = TheSession.PageTitle
                '    Else
                '        'Force Title to "Recall Order" whenever viewing a historical order
                '        FeatureTitle.InnerText = "Recall Order"
                '    End If
            End If

            'If TypeOf (Page) Is PageBase Then
            '    Dim X As PageBase = CType(Page, PageBase)
            '    LoginView2.Visible = (X.PageName = WebPage.Welcome)
            'End If

            If Not Request.Path.EndsWith("/Home.aspx") Then
                Page.ClientScript.RegisterStartupScript(Me.GetType(), "TimeoutScript", "<script type=""text/javascript"">var alo = window.setTimeout('timeoutSession()', 53940000);</script>")
            End If

        End Sub

#End Region

#Region "Control Events"

        Sub LoginStatus1_LoggingOut(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.LoginCancelEventArgs)
            Logout()
        End Sub

        Protected Sub btnLogout_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnLogout.Click
            Logout()
        End Sub

#End Region
        
#Region "Public Methods"

        Public Sub GenerateNavigationBar(ByVal ShowHome As Boolean, ByVal ShowReturnToOrder As Boolean)
            Dim Html, Cells As New StringBuilder()

            Dim ButtonTemplate As String = "<td><div class=""button""><a onclick=""{0}"" >{1}</a>"

            If ShowHome Then
                Cells.Append(String.Format(ButtonTemplate, "window.open('Welcome.aspx', '_self')", "Home"))
            End If

            If ShowReturnToOrder Then
                Dim TargetUrl As String = "OrderView.aspx"
                'If Not String.IsNullOrEmpty(TheSession.ReturnQueryString) Then
                '    'we need to return to the return order screen instead of the main order screen
                '    TargetUrl = "OrderView.aspx?" & TheSession.ReturnQueryString
                'End If
                Cells.Append(String.Format(ButtonTemplate, "window.open('" & TargetUrl & "', '_self')", "View Order"))
            End If

            Html.Append(String.Format("<table><tr>{0}</tr></table>", Cells.ToString()))

            'NavBar.InnerHtml = Html.ToString()

        End Sub

        ''' <summary>
        ''' Gets the value of the specified query string key
        ''' </summary>
        ''' <param name="Key"></param>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public Function GetQueryStringValue(ByVal Key As String) As String
            'If Not IsNothing(Request("qs")) Then
            '    Dim Query As New SecureQueryString(Request("qs"))
            '    If Query.Keys.Count = 0 Then
            '        Return ""
            '    End If
            '    Return Query(Key)
            'Else
            '    Return ""
            'End If
            Return ""
        End Function

        Public Function ConvertToAbsoluteUrl(ByVal relativeUrl As String, Optional ByVal ForceSecure As Boolean = False) As String
            Return Utilities.ConvertToAbsoluteUrl(relativeUrl, Request, Page, ForceSecure)
        End Function

#End Region

#Region "Private Helpers"

        Private Sub Logout()

            Try
                'Clear Session values
                System.Diagnostics.Debug.WriteLine("Session Ended, SessId=" & CType(Session("SessId"), Guid).ToString())

                'Log to database
                Dim WebManager As New WebManager
                WebManager.AppLogInsert(LogType.CustomerLoggedOut, CInt(Session("SessID")), Me.Subscriber.SubscriberId, "Subscrber Logged Out", GetClientIP(Request), GetBrowserData(Request), DateTime.Now)
            Catch ex As Exception

            End Try

            Session.Clear()
            Session.Abandon()
            FormsAuthentication.SignOut()

            'We have to direct to the home page here because Page.User.Identity.IsAuthenticated remains true until the next postback!
            Response.Redirect("Home.aspx", True)


        End Sub

#End Region
        
    End Class

End Namespace
