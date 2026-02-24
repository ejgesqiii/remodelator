Option Strict On

Imports System
Imports System.Collections
Imports System.Collections.Generic
Imports System.Web.UI
Imports System.Web.UI.WebControls
Imports System.Web.UI.HtmlControls
Imports System.Text

Imports RemodelatorBLL

Namespace Remodelator

    ''' <summary>
    ''' This class contains function used to add JavaScript to web pages for such things as setting focus, 
    ''' saving/restoring the packing list, popping up new windows, creating HTML for image slideshows, etc.
    ''' </summary>
    ''' <remarks></remarks>
    Public Module WebUtils

        ''' <summary>
        ''' Adds javascript to the specified page to maintain scroll positions across postbacks
        ''' </summary>
        ''' <param name="WebPage"></param>
        ''' <param name="ScrollingDivID">id of div which contains scroll bar</param>
        ''' <param name="HiddenInputId">id/name of hidden input that will store off scroll position</param>
        ''' <param name="UseAjax">whether or not to use AJAX to store the scroll position. Necessary for the packing list only, as items in the list post to other pages</param>
        ''' <remarks></remarks>
        Public Sub AddJSForScrollPosition(ByVal WebPage As Page, ByVal ScrollingDivID As String, ByVal HiddenInputId As String, ByVal UseAjax As Boolean)
            'Adds the following JS functions to the page so the Order Items scroll bar can be maintained across postbacks
            'function SaveXPos()            //Non-Ajax
            '{
            '    $("OrderItemsScrollPos").value = $("OrderItemsScroll").scrollTop;
            '}
            'function RestoreXPos()
            '{
            '    $("OrderItemsScroll").scrollTop = 123;
            '    $("OrderItemsScrollPos").value = 123;
            '}
            'AddOnload(RestoreXPos);
            '*/
            Dim SaveFunctionName As String = "Save" & HiddenInputId
            Dim RestoreFunctionName As String = "Restore" & HiddenInputId
            Dim ScrollPos As String = WebPage.Request.Form(HiddenInputId)
            If String.IsNullOrEmpty(ScrollPos) Then
                ScrollPos = "0"
            End If
            Dim Text As New StringBuilder()
            Text.Append("<script language=""javascript"">")
            'SaveXXX JS func
            Text.Append(String.Format("function {0}()", SaveFunctionName))
            Text.Append("{")
            Text.Append(String.Format("$(""{0}"").value=$(""{1}"").scrollTop;", HiddenInputId, ScrollingDivID))
            Text.Append("}")
            'RestoreXXX JS func
            Text.Append(String.Format("function {0}()", RestoreFunctionName))
            Text.Append("{")
            Text.Append(String.Format("if ($(""{0}"") != null)", ScrollingDivID))
            Text.Append("{")
            Text.Append(String.Format("$(""{0}"").scrollTop={2};$(""{1}"").value={2};", ScrollingDivID, HiddenInputId, ScrollPos))
            Text.Append("}")
            Text.Append("}")
            'Attach event RestoreXXX
            Text.Append(String.Format("AddOnload({0});", RestoreFunctionName))
            Text.Append("</script>")
            Dim RestoreJSFunc As String = Text.ToString()
            If Not WebPage.ClientScript.IsStartupScriptRegistered(RestoreFunctionName) Then
                WebPage.ClientScript.RegisterStartupScript(WebPage.GetType(), RestoreFunctionName, RestoreJSFunc)
            End If
        End Sub

        '    ''' <summary>
        '    ''' Returns javascript that stores the position of the packing list scrollbar
        '    ''' </summary>
        '    ''' <param name="WebPage">the web page the will contain the javascript</param>
        '    ''' <remarks></remarks>
        '    Public Sub SavePackListPos(ByVal WebPage As Page)

        '        Dim Text As StringBuilder

        '        If IsNothing(WebPage) Then
        '            Exit Sub
        '        End If

        '        If WebPage.Request.Browser.EcmaScriptVersion.Major < 1 Then
        '            Exit Sub
        '        End If

        '        Text = New StringBuilder
        '        Text.Append(vbLf & "<script language=""javascript"" type=""text/javascript"">" & vbLf)
        '        Text.Append("<!--" & vbLf)
        '        Text.Append("function SavePackListPos()" & vbLf)
        '        Text.Append("{" & vbLf)
        '        Text.Append("  var packListPos = $('_ctl0_RemodelatorLeftNav_PackList').scrollTop;" & vbLf)
        '        Text.Append("  var url = ""RequestHandler.aspx"";" & vbLf)
        '        Text.Append("  var params = 'PackListPos=' + packListPos;" & vbLf)
        '        Text.Append("  var x = new Ajax.Request(url, {method: 'get', parameters: params});" & vbLf)
        '        Text.Append("  $('_ctl0_RemodelatorLeftNav_PackListPos').value = packListPos;" & vbLf)
        '        Text.Append("  return false;" & vbLf)
        '        Text.Append("}" & vbLf)
        '        Text.Append("// -->" & vbLf)
        '        Text.Append("</script>")

        '        If (Not WebPage.ClientScript.IsStartupScriptRegistered("SavePackListPos")) Then
        '            WebPage.ClientScript.RegisterClientScriptBlock(WebPage.GetType(), "SavePackListPos", Text.ToString)
        '        End If
        '    End Sub

        '    ''' <summary>
        '    ''' Returns javascript that restores the position of the packing list scrollbar
        '    ''' </summary>
        '    ''' <param name="WebPage">the web page the will contain the javascript</param>
        '    ''' <param name="SessPackListPos">the scroll bar position</param>
        '    ''' <remarks></remarks>
        '    Public Sub RestorePackListPos(ByVal WebPage As Page, ByVal SessPackListPos As String)

        '        Dim Text As StringBuilder

        '        If IsNothing(WebPage) Then
        '            Exit Sub
        '        End If

        '        If WebPage.Request.Browser.EcmaScriptVersion.Major < 1 Then
        '            Exit Sub
        '        End If

        '        Text = New StringBuilder
        '        Text.Append(vbLf & "<script language=""javascript"" type=""text/javascript"">" & vbLf)
        '        Text.Append("<!--" & vbLf)
        '        Text.Append("function RestorePackListPos()" & vbLf)
        '        Text.Append("{" & vbLf)
        '        Text.Append("  $('_ctl0_RemodelatorLeftNav_PackList').scrollTop = " & SessPackListPos & ";" & vbLf)
        '        Text.Append("  $('_ctl0_RemodelatorLeftNav_PackListPos').value = " & SessPackListPos & ";" & vbLf)
        '        Text.Append("}" & vbLf)
        '        Text.Append("// -->" & vbLf)
        '        Text.Append("</script>")

        '        If (Not WebPage.ClientScript.IsStartupScriptRegistered("RestorePackListPos")) Then
        '            WebPage.ClientScript.RegisterClientScriptBlock(Type.GetType("Remodelator2007.WebUtils"), "RestorePackListPos", Text.ToString)
        '        End If

        '    End Sub

        Public Sub SubmitNavigation(ByVal WebPage As Page)
            Dim Text As StringBuilder

            If IsNothing(WebPage) Then
                Exit Sub
            End If

            If WebPage.Request.Browser.EcmaScriptVersion.Major < 1 Then
                Exit Sub
            End If

            Text = New StringBuilder
            Text.Append(vbLf & "<script language=""javascript"" type=""text/javascript"">" & vbLf)
            Text.Append("<!--" & vbLf)
            Text.Append("function SubmitNavPos(NavPos)" & vbLf)
            Text.Append("{" & vbLf)
            Text.Append("  var theform = document.forms[0];" & vbCr)    'DJM: document.forms[0] is valid for IE and FF
            Text.Append("  $('ctl00_CP_HideNavPos').value = NavPos;" & vbLf)
            'Text.Append("  $('_ctl0_MainPageContent_HideNavPos').value = NavPos;" & vbLf)
            Text.Append("  theform.submit();" & vbCr)
            Text.Append("}" & vbLf)
            Text.Append("// -->" & vbLf)
            Text.Append("</script>")

            If (Not WebPage.ClientScript.IsStartupScriptRegistered("SubmitNavigation")) Then
                WebPage.ClientScript.RegisterClientScriptBlock(Type.GetType("Remodelator2007.WebUtils"), "SubmitNavigation", Text.ToString)
            End If

        End Sub

        '    ''' <summary>
        '    ''' Returns javascript that sets focus to a control
        '    ''' </summary>
        '    ''' <param name="Ctrl">the control to set focus to</param>
        '    ''' <remarks></remarks>
        '    Public Sub SetInitialFocus(ByVal Ctrl As Control)

        '        Dim Text As StringBuilder

        '        If IsNothing(Ctrl.Page) Then
        '            Exit Sub
        '        End If

        '        If Ctrl.Page.Request.Browser.EcmaScriptVersion.Major < 1 Then
        '            Exit Sub
        '        End If

        '        Text = New StringBuilder
        '        Text.Append(vbLf & "<script language=""javascript"" type=""text/javascript"">" & vbLf)
        '        Text.Append("<!--" & vbLf)
        '        Text.Append("function SetInitialFocus()" & vbLf)
        '        Text.Append("{" & vbLf)
        '        Text.Append("$('" & Ctrl.ClientID & "').focus();" & vbLf)
        '        Text.Append("}" & vbLf)
        '        If Ctrl.Page.MaintainScrollPositionOnPostBack Then
        '            Text.Append("window.setTimeout(SetInitialFocus, 500);" & vbLf)
        '        Else
        '            Text.Append("window.onload = SetInitialFocus;" & vbLf)
        '        End If
        '        Text.Append("// -->" & vbLf)
        '        Text.Append("</script>")

        '        If (Not Ctrl.Page.ClientScript.IsStartupScriptRegistered("SetInitialFocus")) Then
        '            Ctrl.Page.ClientScript.RegisterClientScriptBlock(Type.GetType("Remodelator2007.WebUtils"), "SetInitialFocus", Text.ToString)
        '        End If

        '    End Sub

        ''' <summary>
        ''' Returns javascript that is used to popup a window
        ''' </summary>
        ''' <param name="WebPage">the web page that will contain the javascript</param>
        ''' <param name="Link">the link that will be opened</param>
        ''' <param name="HasQuote">whether the link contains quotes</param>
        ''' <remarks></remarks>
        Public Sub PopupWindow(ByVal WebPage As Page, ByVal Link As String, ByVal HasQuote As Boolean)
            Dim Text As StringBuilder

            If IsNothing(WebPage) Then
                Exit Sub
            End If

            If WebPage.Request.Browser.EcmaScriptVersion.Major < 1 Then
                Exit Sub
            End If

            Text = New StringBuilder
            Text.Append(vbLf & "<script language=""javaScript"" type=""text/javascript"">" & vbLf)
            Text.Append("<!--" & vbLf)
            Text.Append("function PopupWindow()" & vbLf)
            Text.Append("{" & vbLf)
            If HasQuote Then
                Text.Append("  var linkTo = """ & Link & """;" & vbLf)
            Else
                Text.Append("  var linkTo = '" & Link & "';" & vbLf)
            End If
            Text.Append("  var winName = 'PopupWin';" & vbLf)
            Text.Append("  var settings = 'toolbar=no,locations=no,directories=no,status=no,menubar=no,width=415,height=600';" & vbLf)
            Text.Append("  window.open(linkTo,winName,settings);" & vbLf)
            Text.Append("}" & vbLf)
            Text.Append("// -->" & vbLf)
            Text.Append("</script>")

            If (Not WebPage.ClientScript.IsClientScriptBlockRegistered("PopupWindow")) Then
                WebPage.ClientScript.RegisterClientScriptBlock(Type.GetType("Remodelator2007.WebUtils"), "PopupWindow", Text.ToString)
            End If

        End Sub

        '    ''' <summary>
        '    ''' Returns javascript that will run when the web page finishes loading
        '    ''' </summary>
        '    ''' <param name="WebPage">the web page that will contain the javascript</param>
        '    ''' <param name="TheBody">the body element on the web page</param>
        '    ''' <param name="PackListPos">the packing list's scroll bar position</param>
        '    ''' <param name="Ctrl">the control that should get focus on the web page</param>
        '    ''' <remarks></remarks>
        '    Public Sub SetupPageOnload(ByVal WebPage As Page, _
        '      ByVal TheBody As System.Web.UI.HtmlControls.HtmlGenericControl, _
        '      ByVal PackListPos As String, _
        '      Optional ByVal Ctrl As Control = Nothing)

        '        Dim TheSession As SessionVals
        '        Dim Text As StringBuilder
        '        Dim PackListVisible As Boolean

        '        If IsNothing(WebPage) Then
        '            Exit Sub
        '        End If

        '        If WebPage.Request.Browser.EcmaScriptVersion.Major < 1 Then
        '            Exit Sub
        '        End If

        '        TheSession = CType(WebPage.Session("SessionData"), SessionVals)
        '        PackListVisible = Not TheSession.AtGeneralStore

        '        'DJM: If the packing list isn't visible AND no control should receive focus, there's no need to create the javascript
        '        If (Not PackListVisible And IsNothing(Ctrl)) Then
        '            Exit Sub
        '        End If

        '        If PackListVisible Then
        '            RestorePackListPos(WebPage, PackListPos)
        '            SavePackListPos(WebPage)
        '        End If

        '        If Not IsNothing(Ctrl) Then
        '            If IsNothing(Ctrl.Page) Then
        '                Exit Sub
        '            End If
        '            If Ctrl.Page.Request.Browser.EcmaScriptVersion.Major < 1 Then
        '                Exit Sub
        '            End If
        '        End If

        '        TheBody.Attributes.Add("onLoad", "SetupPageOnLoad()")

        '        Text = New StringBuilder
        '        Text.Append(vbLf & "<script language=""javascript"" type=""text/javascript"">" & vbLf)
        '        Text.Append("<!--" & vbLf)
        '        Text.Append("function SetupPageOnLoad()" & vbLf)
        '        Text.Append("{" & vbLf)
        '        If PackListVisible Then
        '            Text.Append("  RestorePackListPos();" & vbLf)
        '        End If
        '        If Not IsNothing(Ctrl) Then
        '            Text.Append("  $('" & Ctrl.ClientID & "').focus();" & vbLf)
        '        End If
        '        Text.Append("}" & vbLf)
        '        Text.Append("// -->" & vbLf)
        '        Text.Append("</script>")

        '        If (Not WebPage.ClientScript.IsClientScriptBlockRegistered("SetupPageOnload")) Then
        '            WebPage.ClientScript.RegisterClientScriptBlock(Type.GetType("Remodelator2007.WebUtils"), "SetupPageOnLoad", Text.ToString)
        '        End If

        '    End Sub

        '    '''' <summary>
        '    '''' Returns javascript used to run a slideshow of images
        '    '''' </summary>
        '    '''' <param name="TheSession">The session object</param>
        '    '''' <param name="ImgType">the image type to produce the slideshow for</param>
        '    '''' <returns></returns>
        '    '''' <remarks></remarks>
        '    'Public Function GetSlideShowScript(ByVal TheSession As SessionVals, ByVal ImgType As ImageType) As String
        '    '    Dim Text As StringBuilder
        '    '    Dim Scheme, ImagePath, ImageName As String
        '    '    Dim ImageList As List(Of String)
        '    '    Dim OrgID, ImageCount, I As Integer
        '    '    Dim Camps, DoShow As Boolean

        '    '    Text = New StringBuilder()
        '    '    OrgID = TheSession.OrgID
        '    '    ImagePath = TheSession.ImagePath
        '    '    Scheme = TheSession.SchemePath
        '    '    If IsCamp(OrgID) Then
        '    '        Camps = True
        '    '    Else
        '    '        Camps = False
        '    '    End If

        '    '    Select Case ImgType
        '    '        Case ImageType.Home
        '    '            ImageList = TheSession.FlashHomeList
        '    '            ImageCount = ImageList.Count
        '    '            If ImageCount > 1 Then
        '    '                Text.Append("var hm=new Array();")
        '    '                For I = 0 To ImageCount - 1
        '    '                    ImageName = ImageList(I)
        '    '                    Text.Append("hm[" & I & "]=[""/RemodelatorImages/FlashHome/" & ImageName & """];")
        '    '                Next I
        '    '                Text.Append("new fadeshow(hm, 518, 271, 0, 5000, 0, ""R"");")
        '    '                DoShow = True
        '    '            ElseIf ImageCount = 1 Then
        '    '                ImageName = ImageList(0)
        '    '                Text.Append("<img src=""/RemodelatorImages/FlashHome/" & ImageName & """/>")
        '    '            Else
        '    '                'No images for slideshow, so display placeholder image
        '    '                Text.Append("<img src=""/RemodelatorImages/FlashHome/Remodelator1.jpg""/>")
        '    '            End If
        '    '        Case ImageType.Main
        '    '            ImageList = TheSession.FlashPhotoList
        '    '            ImageCount = ImageList.Count
        '    '            If ImageCount > 1 Then
        '    '                Text.Append("var mn=new Array();")
        '    '                For I = 0 To ImageCount - 1
        '    '                    ImageName = ImageList(I)
        '    '                    Text.Append("mn[" & I & "]=[""/RemodelatorImages/FlashPhoto/" & ImageName & """];")
        '    '                Next I
        '    '                Text.Append("new fadeshow(mn, 518, 271, 0, 5000, 0, ""R"");")
        '    '                DoShow = True
        '    '            ElseIf ImageCount = 1 Then
        '    '                ImageName = ImageList(0)
        '    '                Text.Append("<img src=""/RemodelatorImages/FlashPhoto/" & ImageName & """/>")
        '    '            Else
        '    '                If IsSchool(OrgID) Then
        '    '                    If IsCoed(OrgID) Then
        '    '                        'ImageList = GetCoedSchoolsFlash()
        '    '                    ElseIf IsBoys(OrgID) Then
        '    '                        'ImageList = GetBoysSchoolsFlash()
        '    '                    Else
        '    '                        'ImageList = GetGirlsSchoolsFlash()
        '    '                    End If
        '    '                    ImageCount = ImageList.Count
        '    '                    If ImageCount > 1 Then
        '    '                        Text.Append("var mn=new Array();")
        '    '                        For I = 0 To ImageCount - 1
        '    '                            ImageName = ImageList(I)
        '    '                            Text.Append("mn[" & I & "]=[""/RemodelatorImages/FlashPhoto/" & ImageName & """];")
        '    '                        Next I
        '    '                        Text.Append("new fadeshow(mn, 518, 271, 0, 5000, 0, ""R"");")
        '    '                        DoShow = True
        '    '                    ElseIf ImageCount = 1 Then
        '    '                        ImageName = ImageList(0)
        '    '                        Text.Append("<img src=""/RemodelatorImages/FlashPhoto/" & ImageName & """/>")
        '    '                    Else
        '    '                        'No images for slideshow, so display placeholder image
        '    '                        Text.Append("<img src=""/RemodelatorImages/FlashHome/Remodelator1.jpg""/>")
        '    '                    End If
        '    '                Else
        '    '                    'No images for slideshow, so display placeholder image
        '    '                    Text.Append("<img src=""/RemodelatorImages/FlashHome/Remodelator1.jpg""/>")
        '    '                End If
        '    '            End If
        '    '        Case ImageType.NewStuff
        '    '            ImageList = NewStuffFlashList(Camps, Scheme)
        '    '            ImageCount = ImageList.Count
        '    '            If ImageCount > 1 Then
        '    '                Text.Append("var ns=new Array();")
        '    '                For I = 0 To ImageCount - 1
        '    '                    ImageName = ImageList(I)
        '    '                    If Camps Then
        '    '                        Text.Append("ns[" & I & "]=[""/RemodelatorImages/NewStuff/Camps/" & Scheme & "/" & ImageName & """];")
        '    '                    Else
        '    '                        Text.Append("ns[" & I & "]=[""/RemodelatorImages/NewStuff/Schools/" & Scheme & "/" & ImageName & """];")
        '    '                    End If
        '    '                Next I
        '    '                Text.Append("new fadeshow(ns, 190, 102, 0, 5000, 0, ""R"");")
        '    '                DoShow = True
        '    '            ElseIf ImageCount = 1 Then
        '    '                ImageName = ImageList(0)
        '    '                If Camps Then
        '    '                    Text.Append("<img src=""/RemodelatorImages/NewStuff/Camps/" & Scheme & "/" & ImageName & """/>")
        '    '                Else
        '    '                    Text.Append("<img src=""/RemodelatorImages/NewStuff/Schools/" & Scheme & "/" & ImageName & """/>")
        '    '                End If
        '    '            Else
        '    '                'No images for slideshow, so display placeholder image
        '    '                Text.Append("<img src=""" & ImagePath & "NewStuff.jpg""/>")
        '    '            End If
        '    '        Case ImageType.DontForget
        '    '            ImageList = DontForgetFlashList(Camps, Scheme)
        '    '            ImageCount = ImageList.Count
        '    '            If ImageCount > 1 Then
        '    '                Text.Append("var df=new Array();")
        '    '                For I = 0 To ImageCount - 1
        '    '                    ImageName = ImageList(I)
        '    '                    If Camps Then
        '    '                        Text.Append("df[" & I & "]=[""/RemodelatorImages/DontForget/Camps/" & Scheme & "/" & ImageName & """];")
        '    '                    Else
        '    '                        Text.Append("df[" & I & "]=[""/RemodelatorImages/DontForget/Schools/" & Scheme & "/" & ImageName & """];")
        '    '                    End If
        '    '                Next I
        '    '                Text.Append("new fadeshow(df, 180, 102, 0, 5000, 0, ""R"");")
        '    '                DoShow = True
        '    '            ElseIf ImageCount = 1 Then
        '    '                ImageName = ImageList(0)
        '    '                If Camps Then
        '    '                    Text.Append("<img src=""/RemodelatorImages/DontForget/Camps/" & Scheme & "/" & ImageName & """/>")
        '    '                Else
        '    '                    Text.Append("<img src=""/RemodelatorImages/DontForget/Schools/" & Scheme & "/" & ImageName & """/>")
        '    '                End If
        '    '            Else
        '    '                'No images for slideshow, so display placeholder image
        '    '                Text.Append("<img src=""" & ImagePath & "DontForget.jpg""/>")
        '    '            End If
        '    '        Case ImageType.OnSale
        '    '            ImageList = OnSaleFlashList(Camps, Scheme)
        '    '            ImageCount = ImageList.Count
        '    '            If ImageCount > 1 Then
        '    '                Text.Append("var os=new Array();")
        '    '                For I = 0 To ImageCount - 1
        '    '                    ImageName = ImageList(I)
        '    '                    If Camps Then
        '    '                        Text.Append("os[" & I & "]=[""/RemodelatorImages/OnSale/Camps/" & Scheme & "/" & ImageName & """];")
        '    '                    Else
        '    '                        Text.Append("os[" & I & "]=[""/RemodelatorImages/OnSale/Schools/" & Scheme & "/" & ImageName & """];")
        '    '                    End If
        '    '                Next I
        '    '                Text.Append("new fadeshow(os, 189, 102, 0, 5000, 0, ""R"");")
        '    '                DoShow = True
        '    '            ElseIf ImageCount = 1 Then
        '    '                ImageName = ImageList(0)
        '    '                If Camps Then
        '    '                    Text.Append("<img src=""/RemodelatorImages/OnSale/Camps/" & Scheme & "/" & ImageName & """/>")
        '    '                Else
        '    '                    Text.Append("<img src=""/RemodelatorImages/OnSale/Schools/" & Scheme & "/" & ImageName & """/>")
        '    '                End If
        '    '            Else
        '    '                'No images for slideshow, so display placeholder image
        '    '                Text.Append("<img src=""" & ImagePath & "OnSale.jpg""/>")
        '    '            End If
        '    '    End Select

        '    '    If (DoShow) Then
        '    '        GetSlideShowScript = String.Format("<script type=""text/javascript"">{0}</script>", Text.ToString())
        '    '    Else
        '    '        GetSlideShowScript = Text.ToString()
        '    '    End If

        '    '    'WriteInfo(GetSlideShowScript)

        '    'End Function

        '    Public Function IsBrowserMSIE(ByVal userAgent As String) As Boolean
        '        userAgent = userAgent.ToLower()
        '        IsBrowserMSIE = userAgent.IndexOf("msie") <> -1
        '    End Function

        ''' <summary>
        ''' Encrypts a query string value
        ''' </summary>
        ''' <param name="QueryString"></param>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public Function EncryptQueryString(ByVal QueryString As String) As String
            Dim Secret As New Encryption64()
            Return Secret.Encrypt(QueryString, "!#$a54?3")
        End Function

        ''' <summary>
        ''' Encrypts a query string value
        ''' </summary>
        ''' <param name="QueryString"></param>
        ''' <returns></returns>
        ''' <remarks></remarks>
        Public Function DecryptQueryString(ByVal QueryString As String) As String
            Dim Secret As New Encryption64()
            Return Secret.Decrypt(QueryString, "!#$a54?3")
        End Function

        Public Function GetClientIP(ByVal Request As HttpRequest) As String
            GetClientIP = "Unknown"
            If Not IsNothing(Request) Then
                'If running behind a load balancer (like https://ssl.Remodelator.com, client IP is 
                'found in "HTTP_X_CLUSTER_CLIENT_IP" header
                GetClientIP = Request.ServerVariables("HTTP_X_CLUSTER_CLIENT_IP")
                If String.IsNullOrEmpty(GetClientIP) Then
                    'Fallback is to retrieve client IP from REMOTE_ADDR header
                    GetClientIP = Request.ServerVariables("REMOTE_ADDR")
                End If
            End If

        End Function

        Public Function GetBrowserData(ByVal Request As HttpRequest) As String
            GetBrowserData = "Unknown"
            If Not IsNothing(Request) Then
                Dim WebBrowser As System.Web.HttpBrowserCapabilities = Request.Browser
                GetBrowserData = String.Format("Name={0}, Version={1}, Javascript:{2}, Cookies:{3}, Platform:{4}", _
                            WebBrowser.Browser, WebBrowser.Version, WebBrowser.EcmaScriptVersion, _
                            WebBrowser.Cookies, WebBrowser.Platform)
            End If
        End Function

    End Module

    '''' <summary>
    '''' Enumeration of image types that slideshows can be produced for
    '''' </summary>
    '''' <remarks></remarks>
    'Public Enum ImageType
    '    Home
    '    Main
    '    NewStuff
    '    DontForget
    '    OnSale
    'End Enum

End Namespace
