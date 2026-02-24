<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Test.aspx.vb" Inherits="Remodelator.Test" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/tr/html4/loose.dtd">

<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<html xmlns="http://www.w3.org/1999/xhtml" lang="EN">
<head>
    <title>AJAX Content</title>
    <link href="../Styles/demos.css" type="text/css" rel="stylesheet" />
    <link href="../Styles/dialog.css" type="text/css" rel="stylesheet" />
    <link href="../Styles/callBackStyle.css" type="text/css" rel="stylesheet" />
    <link href="../Styles/tabStyle.css" type="text/css" rel="stylesheet" />
    <style type="text/css">
.modalMaskCssClass
{

}
.headerCss
{
	cursor:hand;
	cursor:pointer;
}

</style>
</head>
<body>

    <script type="text/javascript">
      // Image preloading
    (new Image()).src = '../images/Tests/spinner.gif';
    (new Image()).src = '../images/Tests/hover_tab_bg.gif';
    (new Image()).src = '../images/Tests/hover_tab_left_icon.gif';
    (new Image()).src = '../images/Tests/hover_tab_right_icon.gif';

    var selected;

    function selectProduct(param)
    {
      selected = param;
      Dialog1.set_result(param);
      CallBack1.callback(param);
    }

    function dialogshow(dialog)
    {
        Dialog1.set_result(selected);
        document.getElementById("status").innerHTML = dialog.get_id()+" shown";
        document.getElementById("result").innerHTML = dialog.get_result();
    }
    function dialogclose(dialog)
    {
        document.getElementById("status").innerHTML = dialog.get_id()+" closed";
        document.getElementById('showclose').value = 'Show Dialog';
		document.getElementById("result").innerHTML = dialog.get_result();
		document.getElementById('ErrorMsg').innerHTML = "";
    }
    function dialogdrag(dialog)
    {
        document.getElementById("status").innerHTML = dialog.get_id()+" drag started";
        document.getElementById("position").innerHTML = "x: "+dialog.get_x()+" y: "+dialog.get_y();
    }
    function dialogdrop(dialog)
    {
        document.getElementById("status").innerHTML = dialog.get_id()+" dropped";
        document.getElementById("position").innerHTML = "x: "+dialog.get_x()+" y: "+dialog.get_y();
    }
    function dialogfocus(dialog)
    {
        document.getElementById("status").innerHTML = dialog.get_id()+" focused";
    }
    function toggle()
    {
    	if(Dialog1.get_isShowing())
    	{
    	    Dialog1.Close();
    		document.getElementById('showclose').value = 'Show Dialog';
    	}
    	else
    	{
    	    Dialog1.Show();
    		document.getElementById('showclose').value = 'Close Dialog';
    	}
    }
    </script>

    <form id="Form1" method="post" runat="server">
        <div class="DemoArea">
            <input type="button" onclick="toggle();" id="showclose" value="Show Dialog" />
            <ComponentArt:Dialog ID="Dialog1" runat="server" ContentCssClass="contentCss" FooterCssClass="footerCss"
                HeaderCssClass="headerCss" CssClass="dialogCss" Icon="" Value="" HeaderClientTemplateId="header"
                Title="AJAX TabStrip Content" FooterClientTemplateId="footer" ShowTransition="Pixelate"
                CloseTransition="Pixelate" AnimationDuration="200" ModalMaskCssClass="modalMaskCssClass"
                AllowDrag="false" Modal="true" Alignment="MiddleCentre" Height="400" Width="510">
                <ClientEvents>
                    <OnShow EventHandler="dialogshow" />
                    <OnClose EventHandler="dialogclose" />
                    <OnDrag EventHandler="dialogdrag" />
                    <OnDrop EventHandler="dialogdrop" />
                    <OnFocus EventHandler="dialogfocus" />
                </ClientEvents>
                <ClientTemplates>
                    <ComponentArt:ClientTemplate ID="header">
                        <table cellpadding="0" cellspacing="0" width="510" onmousedown="Dialog1.StartDrag(event);">
                            <tr>
                                <td width="5">
                                    <img style="display: block;" src="../images/Tests/top_left.gif" width="5" height="45" /></td>
                                <td style="background-image: url(../images/Tests/top.gif); padding: 10px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td valign="middle" style="color: White; font-size: 15px; font-family: Arial; font-weight: bold;">
                                                ## Parent.Title ##</td>
                                            <td align="right">
                                                <img src="../images/Tests/close.gif" onclick="Dialog1.Close('Close click ( '+Dialog1.get_result()+' )');" width="28" height="15" /></td>
                                        </tr>
                                    </table>
                                </td>
                                <td width="5">
                                    <img style="display: block;" src="../images/Tests/top_right.gif" width="5" height="45" /></td>
                            </tr>
                        </table>
                    </ComponentArt:ClientTemplate>
                    <ComponentArt:ClientTemplate ID="footer">
                        <table cellpadding="0" cellspacing="0" width="510">
                            <tr>
                                <td width="5">
                                    <img style="display: block;" src="../images/Tests/bottom_left.gif" width="5" height="4" /></td>
                                <td style="background-image: url(../images/Tests/bottom.gif); background-color: #F0F0F0;">
                                    <img style="display: block;" src="../images/Tests/spacer.gif" height="4" width="500" /></td>
                                <td width="5">
                                    <img style="display: block;" src="../images/Tests/bottom_right.gif" width="5" height="4" /></td>
                            </tr>
                        </table>
                    </ComponentArt:ClientTemplate>
                </ClientTemplates>
                <Content>
                    <table cellpadding="0" cellspacing="0" width="510" style="background-color: white;
                        height: 200px" border="1">
                        <tr valign="top">
                            <td style="background-image: url(../images/Tests/left.gif);" width="5">
                            </td>
                            <td>
                                <div>
                                    <asp:Label ID="ErrorMsg" runat="server">
                                    </asp:Label><br />
                                    <br />
                                    <br />
                                </div>
                                Hello World!
                                <asp:TextBox ID="txtData" runat="server"></asp:TextBox>
                                <table width="100%">
                                    <tr align="right">
                                        <td>
                                            <asp:Button ID="btnSave" runat="server" Text="Save" />
                                            <asp:Button ID="btnClose" runat="server" Text="Close" OnClientClick="Dialog1.Close('Close click ( '+Dialog1.get_result()+' )');return false;" /></td>
                                    </tr>
                                </table>
                            </td>
                            <td style="background-image: url(../images/Tests/right.gif);" width="5">
                            </td>
                        </tr>
                    </table>
                </Content>
            </ComponentArt:Dialog>
            <br />
            <br />
            <br />
            <br />
            <br />
            <table width="600" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td valign="top">
                        <table width="500" cellpadding="0" cellspacing="5" border="0">
                            <tr>
                                <td valign="top">
                                    <table width="500" cellpadding="0" cellspacing="5" border="0">
                                        <tr>
                                            <td colspan="2" class="MainText">
                                                <span style="font-weight: bold; text-decoration: underline;">Feedback</span>:<br />
                                                <br />
                                        </tr>
                                        <tr>
                                            <td style="width: 100px;">
                                                Events:
                                            </td>
                                            <td align="left" id="status">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Position:
                                            </td>
                                            <td align="left" id="position">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Result:
                                            </td>
                                            <td align="left" id="result">
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    </form>
</body>
</html>
