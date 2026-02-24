Option Strict On

Imports Microsoft.VisualBasic
Imports System.Diagnostics
Imports System.ComponentModel

Imports System.Collections.Generic

Imports ClozWebControls
Imports RemodelatorBLL
Imports RemodelatorDAL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses
Imports RemodelatorDAL.FactoryClasses
Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class RightPane
        Inherits ControlBase

        Dim _TreeManager As New TreeManager()
        Dim _Tree As TreeView
        Const TREE_CONTROL_NAME As String = "tvItems"
        Const PRODUCT_IMAGE_PATH As String = "../Images/Products/"
        Const PDF_PATH As String = "../PDFs/"

#Region "Public Properties"



#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load



        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender

        End Sub

#End Region

#Region "Control Events"

        Protected Sub Login1_Authenticate(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.AuthenticateEventArgs) Handles Login1.Authenticate
            Dim UserManager As New UserManager()
            If UserManager.IsValidUser(Login1.UserName, Login1.Password, False) Then
                Dim Subscriber As SubscriberEntity = UserManager.SubscriberSelect(Login1.UserName)
                e.Authenticated = True
            Else
                e.Authenticated = False
            End If
        End Sub

        Protected Sub Login1_LoggedIn(ByVal sender As Object, ByVal e As System.EventArgs) Handles Login1.LoggedIn
            Dim UserManager As New UserManager()
            Dim WebManager As New WebManager()
            'On successful login, store login information in a session variable
            Dim User As SubscriberEntity = UserManager.SubscriberSelect(Login1.UserName)

            Me.Subscriber = User

            WebManager.AppLogInsert(LogType.CustomerLoggedIn, TheSession.SessID, Subscriber.SubscriberId, "Subscriber Logged In", GetClientIP(Request), GetBrowserData(Request), DateTime.Now)

            'If Not String.IsNullOrEmpty(OrderID) And Not String.IsNullOrEmpty(SubscriberID) Then
            '    If Subscriber.SubscriberId <> CInt(SubscriberID) Then
            '        'a different user has logged in on this computer; have them go to the Welcome page instead of returning them to the order page!
            '        Login1.DestinationPageUrl = "Welcome.aspx"
            '    Else
            '        'Redirect to the OrderView page to pickup from where the user session ended
            '        _secureQS("OrderId") = OrderID
            '        Login1.DestinationPageUrl = String.Format("OrderView.aspx?qs={0}", _secureQS.ToString())
            '    End If
            'Else
            '    'User wasn't viewing an order, so return to Welcome page.
            '    Login1.DestinationPageUrl = "Welcome.aspx"
            'End If

            'User wasn't viewing an order, so return to Welcome page.
            'Login1.DestinationPageUrl = "../WebPages/SubscriberHome.aspx"

            'per Kevin, when user first logs in they must go to 'Create New Estimate' page
            'Response.Redirect("Estimate2.aspx")

            'force the app to go to the Subscriber Home page after a successful login, rather than to the ReturnURL
            Response.Redirect("~/WebPages/SubscriberHome.aspx")


        End Sub


#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"


#End Region

    End Class

End Namespace
