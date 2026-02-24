Option Strict On

Imports System.Web
Imports System.Web.SessionState
Imports System.Drawing

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses

Imports log4net

Namespace Remodelator

    Public Class [Global]
        Inherits System.Web.HttpApplication

        Dim _WebManager As New WebManager()
        Dim x As String

        Sub Application_Start(ByVal sender As Object, ByVal e As EventArgs)
            Application("ComponentArtWebUI_AppKey") = "This edition of ComponentArt Web.UI is licensed."

            ' Code that runs on application startup
            _WebManager.AppLogInsert(LogType.SiteStarted, Nothing, Nothing, "Web Site Started", Nothing, Nothing, DateTime.Now)

            'read in log4net configuration from web.config file
            log4net.Config.XmlConfigurator.Configure()

            'Initialize the database record cache
            RemodelatorBLL.InitCache()
        End Sub

        Sub Session_Start(ByVal sender As Object, ByVal e As EventArgs)
            'create new session values
            Session("SessionData") = New SessionVals()
            _WebManager.AppLogInsert(LogType.SessionStarted, Nothing, Nothing, "User Session Started", Nothing, Nothing, DateTime.Now)
        End Sub

        Sub Application_BeginRequest(ByVal sender As Object, ByVal e As EventArgs)
            ' Fires at the beginning of each request
        End Sub

        Sub Application_AuthenticateRequest(ByVal sender As Object, ByVal e As EventArgs)
            ' Fires upon attempting to authenticate the use
        End Sub

        Sub Application_Error(ByVal sender As Object, ByVal e As EventArgs)
            'An unhandled error occurred on the site. Log the error and notify via e-mail.
            Dim ctx As HttpContext
            Dim ex As Exception
            Dim Subject As String
            Dim Body As String = "Not available"
            Dim SubscriberID As Nullable(Of Integer) = Nothing
            Dim UserData As String = ""

            ctx = HttpContext.Current
            If Not IsNothing(ctx) Then
                Dim Subscriber As SubscriberEntity = CType(Session("Subscriber"), SubscriberEntity)
                If Not IsNothing(Subscriber) Then
                    UserData = String.Format("SubscriberID={0}" & vbCrLf & "Name={1}" & vbCrLf & "Username:{2}" & vbCrLf, _
                        Subscriber.SubscriberId, Subscriber.FullName, ctx.Request.ServerVariables("AUTH_USER"))
                    SubscriberID = Subscriber.SubscriberId
                End If
                ex = ctx.Server.GetLastError()
                Body = "Date: " & Now & vbCrLf & _
                    UserData & _
                    "IP: " & ctx.Request.ServerVariables("REMOTE_ADDR") & vbCrLf & _
                    "URL: " & ctx.Request.Url.ToString() & vbCrLf & _
                    "Referrer: " & ctx.Request.ServerVariables("HTTP_REFERER") & vbCrLf & _
                    "Form: " & ctx.Request.Form.ToString() & vbCrLf & _
                    "Source: " & ex.Source & vbCrLf & _
                    "Message: " & ex.Message & vbCrLf & _
                    "Stack trace: " & ex.ToString()
            End If

            Subject = "Web Site Error occurred"

            'Log to database
            _WebManager.AppLogInsert(LogType.WebError, 0, SubscriberID, Body, GetClientIP(Request), Nothing, DateTime.Now)

            'Send email with error information
            Utilities.SendMail("", "", Subject, Body, System.Net.Mail.MailPriority.High, True)
        End Sub

        Sub Session_End(ByVal sender As Object, ByVal e As EventArgs)
            _WebManager.AppLogInsert(LogType.SessionEnded, Nothing, Nothing, "User Session Ended", Nothing, Nothing, DateTime.Now)
        End Sub

        Sub Application_End(ByVal sender As Object, ByVal e As EventArgs)

        End Sub

    End Class

End Namespace
