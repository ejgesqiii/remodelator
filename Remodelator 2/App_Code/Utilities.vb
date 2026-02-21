Imports Microsoft.VisualBasic

Imports System.Diagnostics
Imports System.Collections.Generic
Imports System.Net.Mail

Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Public Module Utilities

        Public Function GetNodeType(ByVal NodeTypeID As Nullable(Of Integer)) As NodeType
            If NodeTypeID.GetValueOrDefault() = 1 Then
                Return NodeType.Item
            ElseIf NodeTypeID.GetValueOrDefault() = 2 Then
                Return NodeType.Folder
            ElseIf NodeTypeID.GetValueOrDefault() = 3 Then
                Return NodeType.Accessory
            Else
                Return NodeType.None
            End If
        End Function

        Public Function GetNodeImage(ByVal Node As NodeItemViewEntity) As String
            If Node.NodeTypeId = 1 Or Node.NodeTypeId = 3 Then
                GetNodeImage = "i.gif"
            Else
                GetNodeImage = "f.gif"
            End If
        End Function

        Public Function GetNodeText(ByVal Name As String, ByVal NodeID As Integer, ByVal Position As Integer) As String
            Return Name & " (" & NodeID & "." & Position & ")"
        End Function

        Public Function GetTreeBranch(ByVal Mode As AdminView, ByVal NodeID As Integer) As TreeView

            Dim _TreeManager As New TreeManager()
            Dim TreeView1 As New TreeView()
            Dim NewNode As TreeViewNode
            Dim CurParentNode As New TreeViewNode
            Dim _ClientMode As Boolean = False

            Dim Nodes As EntityCollection(Of NodeItemViewEntity) = _TreeManager.GetNodeChildren(NodeID)
            If Nodes.Count = 0 Then
                Return Nothing
            End If

            For Each Node As NodeItemViewEntity In Nodes
                If Mode = AdminView.Item And Node.NodeTypeId = 3 Then
                    Continue For
                End If
                If Mode = AdminView.ItemAccessory And Node.NodeTypeId = 1 Then
                    Continue For
                End If
                'Debug.WriteLine(Node.Name)
                NewNode = New TreeViewNode()
                NewNode.ImageUrl = Utilities.GetNodeImage(Node)
                NewNode.Text = GetNodeText(Node.Name, Node.NodeId, Node.Position)
                NewNode.ID = NodeInfo.MakeNodeID(Node.NodeId, Node.NodeTypeId)
                If _ClientMode Then
                    NewNode.ClientSideCommand = "getNode('" & Node.NodeId & "');"
                    NewNode.AutoPostBackOnSelect = False
                End If
                If Node.NodeTypeId = 2 Then
                    'NewNode.ContentCallbackUrl = "Request.aspx?ID=" & Node.NodeId & "&T=" & Rnd(12)
                    NewNode.ContentCallbackUrl = "Request.aspx?ID=" & Node.NodeId
                Else
                    If Not Node.EditsComplete Then
                        'Items whare aren't complete should appear in bold italic text
                        NewNode.CssClass = "TreeNodeNC"
                        NewNode.HoverCssClass = "HoverTreeNodeNC"
                        NewNode.SelectedCssClass = "SelectedTreeNodeNC"
                    End If
                End If
                'Disable the ability to drop anything onto this node
                'NewNode.DroppingEnabled = False
                TreeView1.Nodes.Add(NewNode)
            Next

            Return TreeView1

        End Function

        Public Function IsValidZipCode(ByVal Text As String, ByVal IsUSAZip As Boolean) As Boolean
            If IsUSAZip Then
                Return IsValidUSAZip(Text)
            Else
                Return Not String.IsNullOrEmpty(Text)
            End If
        End Function

        Public Function IsValidUSAZip(ByVal Text As String) As Boolean
            Dim Pattern As String

            Text = MakeZipCode(Text, True)

            '5 or 9 digits(99999 or 999999999)
            If Len(Text) = 5 Then
                Pattern = "^\d{5}$"
            ElseIf Len(Text) = 9 Then
                Pattern = "^\d{9}$"
            Else
                Pattern = "^\d{5}-\d{4}$"
            End If

            Return Regex.IsMatch(Text, Pattern)

        End Function

        Public Function IsValidCANZip(ByVal Text As String) As Boolean
            Dim Pattern As String

            Text = MakeZipCode(Text, False)

            'Canadian Postal Codes are always formatted in the same sequence:
            'Letter/Number/LetterSPACENumber/Letter/Number (eg. K1A 0B1)
            If Len(Text) = 7 Then
                Pattern = "(?:[A-Z]\d[A-Z] \d[A-Z]\d)"
            Else
                Pattern = "(?:[A-Z]\d[A-Z]\d[A-Z]\d)"
            End If

            Return Regex.IsMatch(Text, Pattern)

        End Function

        Public Function IsCountryUSA(ByVal countryText As String) As Boolean
            If String.IsNullOrEmpty(countryText) Then
                Return True
            Else
                Return countryText.ToLower() = "usa" Or countryText.ToLower() = "united states of america"
            End If
        End Function

        Public Function GetItemBreadcrumb(ByVal MainMenu As Menu) As String
            Try
                If Not IsNothing(MainMenu) Then
                    If Not IsNothing(MainMenu.SelectedItem.ParentItem) Then
                        Return MainMenu.SelectedItem.ParentItem.Text & " > " & MainMenu.SelectedItem.Text
                    Else
                        Return MainMenu.SelectedItem.Text
                    End If
                Else
                    Return ""
                End If
            Catch ex As Exception
                Return ""
            End Try
        End Function

        Public Function GetEstimateBanner(ByVal Estimate As OrderEntity, ByVal ShowViewPurchases As Boolean, Optional ByVal SelectedNodeID As Integer = 0) As String
            Dim SeePurchases, ViewProposal As String

            If IsNothing(Estimate) Then
                Return ""
            Else
                Dim Text As New StringBuilder()
                Dim Title As String = String.Format("<b>Current {0}: </b>{1}", CStr(IIf(Estimate.IsTemplate, "Template", "Estimate")), Estimate.Description)
                'Dim FinishEstimate As String = "<a href=""EstimateCheckout.aspx?ID=" & Estimate.OrderId & """ target=""_self"">Estimate Finished</a>"
                'Dim SeePurchases As String = "View Purchases"
                'Dim FinishEstimate As String = "Estimate Finished"
                Dim ProjectTotal As String = "<div style=""padding:0px 0px 0px 20px"">Current Project Total: " & Estimate.OrderTotal.ToString("c") & "</div>"
                If ShowViewPurchases Then
                    Dim Template1 As String = "<table cellpadding=""0"" cellspacing=""0"" border=""0""><tr>" & _
                    "<td>{0}</td><td style=""padding:0px 0px 0px 20px"">{1}</td>" & _
                    "<td>{2}</td>" & _
                    "</tr></table>"
                    SeePurchases = "<a class=""Link1"" href=""Estimate.aspx?ID=" & Estimate.OrderId & """ target=""_self"" style=""padding:0px 0px 0px 20px"">View Purchases</a>"
                    Return String.Format(Template1, Title, SeePurchases, ProjectTotal)
                Else
                    Dim Template2 As String = "<table cellpadding=""0"" cellspacing=""0"" border=""0""><tr>" & _
                    "<td>{0}</td><td style=""padding:0px 0px 0px 20px"">{1}</td>" & _
                    "<td>{2}</td>" & _
                    "<td>{3}</td>" & _
                    "</tr></table>"
                    If Estimate.OrderTotal > 0 And Not Estimate.IsTemplate Then
                        ViewProposal = "<a class=""Link1"" href=""Proposal.aspx"" target=""_self"" style=""padding:0px 0px 0px 20px"">View Proposal</a>"
                    Else
                        ViewProposal = ""
                    End If
                    'we're on the estimate page - allowing viewing of client proposal
                    'get ancestor nodes so we can find root node to open when user clicks 'Return to Selections' link
                    Dim TreeManager As New TreeManager()
                    Dim BaseClassManager As New BaseClassManager()
                    Dim Ancestors As EntityCollection(Of TreeEntity) = TreeManager.TreeAncestorList(SelectedNodeID)   'hit db
                    If Ancestors.Count > 0 Then
                        Dim RootNodeID As Integer = Ancestors(0).ParentId
                        'Get the tab that the root child is on
                        Dim Tab As TabEntity = BaseClassManager.TabSelectByNodeID(RootNodeID)
                        Dim NavURL As String = String.Format(Tab.NavigateUrl & ".aspx?NodeID={0}&SelectedNodeID={1}", RootNodeID, SelectedNodeID)
                        Dim ReturnToSelections As String = String.Format("<a class=""Link1"" href=""{0}"" target=""_self"" style=""padding:0px 0px 0px 20px"">Return To Selections</a>", NavURL)
                        Return String.Format(Template2, Title, ReturnToSelections, ViewProposal, ProjectTotal)
                    Else
                        Return String.Format(Template2, Title, "", ViewProposal, ProjectTotal)
                    End If
                End If
            End If
        End Function

        Public Function IsPositiveNumber(ByVal Number As String, Optional ByVal IncludeZero As Boolean = True) As Boolean
            If IsNumeric(Number) Then
                If IncludeZero Then
                    Return (CDec(Number) >= 0)
                Else
                    Return (CDec(Number) > 0)
                End If
            End If

        End Function

        Public Function IsInteger(ByVal Number As String) As Boolean
            Dim Result As Integer
            Return Int32.TryParse(Number, Result)
        End Function

        Public Function IsPositiveInteger(ByVal Number As String, Optional ByVal IncludeZero As Boolean = True) As Boolean
            If IsInteger(Number) Then
                If IncludeZero Then
                    Return (CInt(Number) >= 0)
                Else
                    Return (CInt(Number) > 0)
                End If
            End If
        End Function

        'Pulled directly from Web
        Public Function SendMail(ByVal FromAddr As String, ByVal ToAddr As String, ByVal Subject As String, _
            ByVal Body As String, ByVal Priority As MailPriority, ByVal IsBodyHtml As Boolean) As Boolean

            Dim MailMsg As MailMessage
            Dim client As SmtpClient
            Dim EmailContent As String

            Dim SMTPServer As String = ConfigurationManager.AppSettings("SMTPServer")
            Dim EmailRecipients As String = ConfigurationManager.AppSettings("EmailRecipients")
            Dim EmailSender As String = ConfigurationManager.AppSettings("EmailSender")

            EmailContent = String.Format("FromAddr={0}, ToAddr={1}, Subject={2}, Body={3}", FromAddr, ToAddr, Subject, Body)

            If SMTPServer = "" Then
                'Emailing is disabled
                Log.Error("Could not send email - SMTPServer is not specified in web.config. Content=" & EmailContent)
            End If
            If FromAddr = "" Then
                FromAddr = EmailSender
            End If
            If ToAddr = "" Then
                ToAddr = EmailRecipients
            End If

            MailMsg = New MailMessage(FromAddr, ToAddr, Subject, Body)
            MailMsg.Priority = Priority
            MailMsg.IsBodyHtml = IsBodyHtml
            If IsBodyHtml Then
                MailMsg.Body = Regex.Replace(MailMsg.Body, "\n", "<br/>")
            End If
            client = New SmtpClient()
            client.Host = SMTPServer
            client.Send(MailMsg)
            MailMsg = Nothing
            SendMail = True

        End Function

        Public Function ConvertToAbsoluteUrl(ByVal relativeUrl As String, ByVal Request As HttpRequest, ByVal Page As System.Web.UI.Page, Optional ByVal ForceSecure As Boolean = False) As String
            If Request.IsSecureConnection Or ForceSecure Then
                Return String.Format("https://{0}{1}", Request.Url.Host, Page.ResolveUrl(relativeUrl))
                Log.Debug("Secure connection")
            Else
                Return String.Format("http://{0}{1}", Request.Url.Host, Page.ResolveUrl(relativeUrl))
                Log.Debug("Unsecure connection")
            End If
        End Function

        Public Function FormatPageTitle(ByVal Title As String) As String
            Return String.Format("Remodelator - {0}", Title)
            'Return Title
        End Function

    End Module

End Namespace
