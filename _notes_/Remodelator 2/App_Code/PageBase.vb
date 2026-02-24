Option Strict On

Imports Microsoft.VisualBasic
Imports System.Collections.Generic
Imports System.Diagnostics
Imports System.IO

Imports RemodelatorBLL
Imports RemodelatorDAL
Imports RemodelatorDAL.EntityClasses

Namespace Remodelator

    Public Class PageBase
        Inherits System.Web.UI.Page

        'Protected _secureQS As New SecureQueryString()
        Protected _PageName As WebPage

        Private _redirectUrl As String = "~/WebPages/Home.aspx"

#Region "Public Properties"

        Public ReadOnly Property ParentPage() As PageBase
            Get
                Return CType(Me.Page, PageBase)
            End Get
        End Property

        Property TheSession() As SessionVals
            Get
                Return CType(Session("SessionData"), SessionVals)
            End Get
            Set(ByVal value As SessionVals)
                Session("SessionData") = value
            End Set
        End Property

        Public ReadOnly Property Mode() As AdminView
            Get
                Dim o As Object = Session("Mode")
                If IsNothing(o) Then
                    Return AdminView.Item
                Else
                    Return CType(o, AdminView)
                End If
            End Get
        End Property

        Public Property SelectedItemConfigNodeId() As Nullable(Of Integer)
            Get
                Dim o As Object = Session("SelectedItemConfigNodeId")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CType(o, Nullable(Of Integer))
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                Session("SelectedItemConfigNodeId") = value
            End Set
        End Property

        Public Property SelectedAccessoryConfigNodeId() As Nullable(Of Integer)
            Get
                Dim o As Object = Session("SelectedAccessoryConfigNodeId")
                If IsNothing(o) Then
                    Return Nothing
                Else
                    Return CType(o, Nullable(Of Integer))
                End If
            End Get
            Set(ByVal value As Nullable(Of Integer))
                Session("SelectedAccessoryConfigNodeId") = value
            End Set
        End Property

        Public ReadOnly Property IsAuthenticated() As Boolean
            Get
                Return Page.User.Identity.IsAuthenticated
            End Get
        End Property

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

        Public Property Estimate() As OrderEntity
            Get
                Dim o As Object = Session("Estimate")
                If IsNothing(o) Then
                    Debug.WriteLine("Estimate not available.")
                    Return Nothing
                Else
                    Return CType(o, OrderEntity)
                End If
            End Get
            Set(ByVal value As OrderEntity)
                Session("Estimate") = value
            End Set
        End Property

        Public Property OrderItemDetail() As OrderItemDetailViewEntity
            Get
                Dim o As Object = Session("OrderItemDetail")
                If IsNothing(o) Then
                    Debug.WriteLine("OrderItem not available.")
                    Return Nothing
                Else
                    Return CType(o, OrderItemDetailViewEntity)
                End If
            End Get
            Set(ByVal value As OrderItemDetailViewEntity)
                Session("OrderItemDetail") = value
            End Set
        End Property

        ''' <summary>
        ''' The last node the user selected when browsing items
        ''' </summary>
        ''' <value></value>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public Property LastItemSelectionNodeID() As Integer
            Get
                Dim o As Object = Session("LastItemSelectionNodeID")
                If IsNothing(o) Then
                    Debug.WriteLine("LastItemSelectionNodeID not available.")
                    Return 0
                Else
                    Return CInt(o)
                End If
            End Get
            Set(ByVal value As Integer)
                Session("LastItemSelectionNodeID") = value
            End Set
        End Property

        ''' <summary>
        ''' The name of this web page
        ''' </summary>
        ''' <value></value>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public Property PageName() As WebPage
            Get
                Return _PageName
            End Get
            Set(ByVal value As WebPage)
                _PageName = value
            End Set
        End Property

#End Region

        Protected Overrides Sub OnPreInit(ByVal e As System.EventArgs)
            MyBase.OnPreInit(e)

            'programmatically set the theme for the site
            'Page.Theme = TheSession.SchemePath

        End Sub

        '''' <summary>
        '''' Gets the value of the specified query string key
        '''' </summary>
        '''' <param name="Key"></param>
        '''' <returns></returns>
        '''' <remarks></remarks>
        'Public Function GetQueryStringValue(ByVal Key As String) As String
        '    If Not IsNothing(Request("qs")) Then
        '        Dim Query As New SecureQueryString(Request("qs"))
        '        If Query.Keys.Count = 0 Then
        '            Return ""
        '        End If
        '        Return Query(Key)
        '    Else
        '        Return ""
        '    End If
        'End Function

        Private Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
            ' Redirect user to login page just before their session times out by
            ' adding a header to page to forWce a refresh, but ONLY if they're currently logged in
            'Dim timeoutInMinutes As Integer = Session.Timeout * 60 - 40
            '_secureQS("timeout") = "1"
            'Response.AppendHeader("Refresh", String.Format("{0};URL=Login.aspx?qs={1}", timeoutInMinutes, _secureQS.ToString()))
            'Response.AppendHeader("Refresh", String.Format("{0};URL=Home.aspx?timeout=1", timeoutInMinutes))

            'Check to see whether or not session is dead...if so, redirect to login page
            'Note: the login page should not utilize this logic!
            If _redirectUrl Is Nothing Then
                Throw New InvalidOperationException("RedirectUrl Property Not Set.")
            End If
            If Not IsNothing(Context.Session) Then
                If Session.IsNewSession Then
                    Dim szCookieHeader As String = Request.Headers("Cookie")
                    If Not IsNothing(szCookieHeader) AndAlso szCookieHeader.IndexOf("ASP.NET_SessionId") >= 0 Then
                        If Page.Request.IsAuthenticated Then
                            FormsAuthentication.SignOut()
                        End If
                        Session("Timeout") = True
                        Page.Response.Redirect(_redirectUrl, True)
                    End If
                End If
            End If

            'pageMode = Request.QueryString("Mode")
            'If (Not IsNothing(pageMode)) Then
            '    Mode = CType(System.Enum.Parse(GetType(PageModes), pageMode), PageModes)
            'End If

            'If Not IsNothing(Request("qs")) Then
            '    Dim Query As New SecureQueryString(Request("qs"))
            '    If Query.Keys.Count = 0 Then
            '        'User tampered with query string
            '        Response.Redirect("PageNotFound.aspx")
            '    End If
            '    pageMode = Query("Mode")
            '    If Not IsNothing(pageMode) Then
            '        Mode = CType(System.Enum.Parse(GetType(PageModes), pageMode), PageModes)
            '    End If
            'End If

            'If Mode <> PageModes.View Then
            '    If RequireUserVerification And Not AccessGranted Then
            '        If Request.UrlReferrer <> Nothing Then
            '            'Don't allow user to get to add/edit page by using browser's back button
            '            Debug.WriteLine(Request.UrlReferrer().ToString())
            '            Response.Redirect(Request.UrlReferrer().ToString())
            '        Else
            '            Response.Redirect("PageError.aspx?IllegalAccessViaBackButton=true", True)
            '        End If
            '    End If
            'End If

            'The following settings seem to be sufficient for not caching pages in FF or IE
            'When user hits the back button on the browser, the page will be re-requested from server
            'and latest data will be retrieved
            'If the back button is hit enough times, a 'Page Expired' message will appear
            'Response.Cache.SetNoStore()         'needed for firefox
            'Response.Cache.SetCacheability(HttpCacheability.NoCache)    'works for IE
            'Response.Buffer = True
            'Response.ExpiresAbsolute = Now().AddMinutes(-1)
            'Response.Expires = -1
            'Response.CacheControl = "no-cache"
            'Response.CacheControl = "no-store"
            'Response.CacheControl = "post-check=0"
            'Response.CacheControl = "pre-check=0"
            'Response.Cache.SetCacheability(HttpCacheability.Private)
            'Response.Cache.SetExpires(DateTime.Now.AddDays(-1))

            'Dim hide1 As HtmlInputHidden = CType(Form.FindControl("ctl00_dataOrderId"), HtmlInputHidden)
            'Dim hide2 As HtmlInputHidden = CType(Form.FindControl("ctl00$dataOrderId"), HtmlInputHidden)
            'Dim hide3 As HtmlInputHidden = CType(Form.FindControl("dataOrderId"), HtmlInputHidden)
            'Dim x As String = Request.Form("ctl00_dataOrderId")
            'Dim y As String = Request.Form("ctl00$dataOrderId")
            'If Not IsNothing(y) Then
            '    'Session("OrderId") = CInt(y)
            'End If

        End Sub

        Protected Overrides Sub OnPreRender(ByVal e As System.EventArgs)
            MyBase.OnPreRender(e)

            ''<body onPageLoad="history.go(1)">

            ''Dim sb As StringBuilder = New StringBuilder()
            ''sb.Append("<script language=javascript>")
            ''sb.Append("window.history.forward(1);")
            ''sb.Append("</script>")
            ''Page.ClientScript.RegisterClientScriptBlock(GetType(Page), "clientScript", sb.ToString())

            'If Mode = PageModes.View Then
            '    'pages which are configured for viewing should always clear the AccessGranted session variable
            '    'so users cannot back into edit pages!
            '    AccessGranted = False
            'End If

            ''Sore off the current order that's being viewed. This will be used to determine if a user attempts to
            ''view a different order via an unsupported method (like direct modification of the url)
            ''If Not IsNothing(ClozOrder) Then
            ''    Dim hide As HtmlInputHidden = New HtmlInputHidden()
            ''    hide.ID = "dataOrderId"
            ''    hide.Name = "dataOrderId"
            ''    hide.Value = CStr(ClozOrder.OrderId)
            ''    Form.Controls.Add(hide)
            ''End If

            ''When a page renders, set the last web page session variable to the page's name. This will be used to
            ''detect when a user hits the back button to attempt to return to a previous page while they're entering/viewing
            ''a new order
            'LastWebPage = Me.PageName
        End Sub

        '''' <summary>
        '''' Clears the session and signs the user out
        '''' </summary>
        '''' <remarks></remarks>
        'Public Sub EndSession()

        '    'System.Diagnostics.Debug.WriteLine("Session Ended, SessId=" & CType(Session("SessId"), Guid).ToString())
        '    'Session.Clear()
        '    Session.Abandon()
        '    FormsAuthentication.SignOut()

        'End Sub

        'Public Sub ValidateOrderId()
        '    If Not IsNothing(ClozOrder) Then

        '        If (OrderId <> ClozOrder.OrderId) Then
        '            Response.Redirect("PageError.aspx?BackButton=true&OldId=" & OrderId & "&NewId=" & ClozOrder.OrderId, True)
        '        End If
        '    Else
        '        Response.Redirect("PageError.aspx?NoOrderSelected=true", True)
        '    End If
        'End Sub

        Protected Overrides Sub Render(ByVal writer As System.Web.UI.HtmlTextWriter)
            Dim sw As New StringWriter
            Dim localWriter As New HtmlTextWriter(sw)
            MyBase.Render(localWriter)
            Dim output As String = sw.ToString
            Log.Info("Page Size: " & output.Length)
            writer.Write(output)
        End Sub

        'Protected Overrides Function LoadPageStateFromPersistenceMedium() As Object
        '    Dim key As String = Request.RawUrl + "_VIEWSTATE"
        '    Dim state As Object = Session(key)
        '    If IsNothing(state) Then
        '        Return MyBase.LoadPageStateFromPersistenceMedium()
        '    Else
        '        Return state
        '    End If
        'End Function

        Protected Overrides Sub SavePageStateToPersistenceMedium(ByVal viewState As Object)
            MyBase.SavePageStateToPersistenceMedium(viewState)

            Dim format As New LosFormatter
            Dim writer As StringWriter = New StringWriter
            format.Serialize(writer, viewState)
            Log.Info("ViewState Size: " & writer.ToString().Length)

            'Dim key As String = Request.RawUrl + "_VIEWSTATE"
            'Session(key) = viewState
        End Sub

        Public Function ConvertToAbsoluteUrl(ByVal relativeUrl As String, Optional ByVal ForceSecure As Boolean = False) As String
            Return Utilities.ConvertToAbsoluteUrl(relativeUrl, Request, Page, ForceSecure)
        End Function
    End Class

End Namespace

