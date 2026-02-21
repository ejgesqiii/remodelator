<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Test3.aspx.vb" Inherits="Remodelator.Test3" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/tr/html4/loose.dtd">
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<html xmlns="http://www.w3.org/1999/xhtml" lang="EN">
<head>

    <script language="javascript">
 function DoCallback(param)
  {
   Callback1.Callback(param);
  }
  
  var img1 = new Image();
img1.src = 'images/spinner.gif';

function selectProduct(param)
{
    CallBack2.Callback(param);
}

    </script>

    <style>
body, td
{
  background-color:White;
  font-family: arial;
  font-size:11px;
  color:#3F3F3F;
}
</style>
</head>
<body>
    <form id="Form1" method="post" runat="server">
        <ComponentArt:CallBack ID="Callback1" runat="server">
            <Content ID="Content1">
                <asp:Label ID="lblTicks" runat="server"></asp:Label>
            </Content>
        </ComponentArt:CallBack>
        <br />
        <asp:HyperLink NavigateUrl="javascript:DoCallback('none');" ID="hlnkGetTicks" runat="server">Get Ticks
        </asp:HyperLink>
        <!-- Test #2 -->
        <ComponentArt:CallBack ID="CallBack2" CacheContent="true" CssClass="CallBack" Width="450"
            Height="250" runat="server">
            <Content>
                <asp:PlaceHolder ID="PlaceHolder1" runat="server">
                    <table cellspacing="0" cellpadding="0" border="0" style="color: #666666;" width="100%"
                        height="100%">
                        <tr>
                            <td colspan="2" height="30" valign="top">
                                <asp:Label ID="lblProductTitle" Style="font-size: 15px; font-weight: bold;" runat="server" /><br />
                                <asp:Label ID="lblProductTagLine" runat="server" /></td>
                        </tr>
                        <tr>
                            <td width="190" height="140">
                                <asp:Image ID="imgProductImage" Width="190" Height="140" runat="server" /></td>
                            <td>
                                <table cellspacing="0" cellpadding="5" border="0" width="100%" style="color: #666666;">
                                    <tr>
                                        <td>
                                            List Price:</td>
                                        <td>
                                            <asp:Label ID="lblListPrice" runat="server" /></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Our Price:</td>
                                        <td>
                                            <asp:Label ID="lblOurPrice" Style="color: #B21515;" runat="server" /></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            You Save:</td>
                                        <td>
                                            <asp:Label ID="lblSavings" Style="color: #B21515;" runat="server" /></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Availability:</td>
                                        <td>
                                            <nobr><asp:Label ID="lblAvailability" runat="server" />
      </nobr>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <asp:Label ID="lblProductInfo" runat="server" />
                            </td>
                        </tr>
                    </table>
                </asp:PlaceHolder>
            </Content>
            <LoadingPanelClientTemplate>
                <table width="428" height="228" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                        <td align="center">
                            <table cellspacing="0" cellpadding="0" border="0"> 
                                <tr>
                                    <td style="font-size: 10px;">
                                        Loading...
                                    </td>
                                    <td>
                                        <img src="../images/tests/spinner.gif" width="16" height="16" border="0" /></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </LoadingPanelClientTemplate>
        </ComponentArt:CallBack>
        <table cellspacing="0" cellpadding="2" border="0">
            <asp:Repeater ID="Repeater1" runat="server">
                <ItemTemplate>
                    <tr>
                        <td>
                            <img width="12" height="8" border="0" /></td>
                        <td>
                            <img src="../images/test/chevron.gif" width="12" height="8" border="0"></td>
                        <td>
                            <a onmouseover="javascript:selectProduct('<%# DataBinder.Eval(Container.DataItem, "ProductId")%>');"
                                href="javascript:selectProduct('<%# DataBinder.Eval(Container.DataItem, "ProductId")%>');">
                                <%# DataBinder.Eval(Container.DataItem, "Title")%>
                            </a>
                        </td>
                    </tr>
                </ItemTemplate>
            </asp:Repeater>
        </table>
    </form>
</body>
</html>
