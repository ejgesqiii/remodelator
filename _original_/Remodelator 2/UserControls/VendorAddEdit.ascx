<%@ Control Language="VB" AutoEventWireup="false" CodeFile="VendorAddEdit.ascx.vb"
    Inherits="Remodelator.VendorAddEdit" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>

<script type="text/javascript">
    function dialogclose(dialog) {
		//specific to this dialog
        //document.getElementById('<%=ClientId%>_ErrorMessage').innerHTML = "";
        //document.getElementById('<%=ClientId%>_txtData').value = "";
    }
</script>

<ComponentArt:Dialog ID="Dialog1" runat="server" ContentCssClass="contentCss" FooterCssClass="footerCss"
    HeaderCssClass="headerCss" CssClass="dialogCss" Icon="" Value="" HeaderClientTemplateId="header"
    Title="Create New Vendor" FooterClientTemplateId="footer" ShowTransition="Pixelate"
    CloseTransition="Pixelate" AnimationDuration="200" ModalMaskCssClass="modalMaskCssClass"
    AllowDrag="false" Modal="true" Alignment="MiddleCentre" Height="400" Width="510">
    <ClientEvents>
        <OnClose EventHandler="dialogclose" />
    </ClientEvents>
    <ClientTemplates>
        <ComponentArt:ClientTemplate ID="header">
            <table cellpadding="0" cellspacing="0" width="510" onmousedown="Dialog1.StartDrag(event);">
                <tr>
                    <td width="5">
                        <img style="display: block;" src="../images/Tests/top_left.gif" /></td>
                    <td style="background-image: url(../images/Tests/top.gif); padding: 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td valign="middle" style="color: White; font-size: 15px; font-family: Arial; font-weight: bold;">
                                    ## Parent.Title ##</td>
                                <td align="right">
                                    <img src="../images/Tests/close.gif" onclick="Dialog1.Close('Close click ( '+Dialog1.get_result()+' )');" /></td>
                            </tr>
                        </table>
                    </td>
                    <td width="5">
                        <img style="display: block;" src="../images/Tests/top_right.gif" /></td>
                </tr>
            </table>
        </ComponentArt:ClientTemplate>
        <ComponentArt:ClientTemplate ID="footer">
            <table cellpadding="0" cellspacing="0" width="510">
                <tr>
                    <td width="5">
                        <img style="display: block;" src="../images/Tests/bottom_left.gif" /></td>
                    <td style="background-image: url(../images/Tests/bottom.gif); background-color: #F0F0F0;">
                        <img style="display: block;" src="../images/Tests/spacer.gif" height="4" width="500" /></td>
                    <td width="5">
                        <img style="display: block;" src="../images/Tests/bottom_right.gif" /></td>
                </tr>
            </table>
        </ComponentArt:ClientTemplate>
    </ClientTemplates>
    <Content>
        <table cellpadding="0" cellspacing="0" width="510" style="background-color: white;
            height: 200px" border="0">
            <tr valign="top">
                <td style="background-image: url(../images/Tests/left.gif);" width="5">
                </td>
                <td>
                    <div id="ErrorPanel" runat="server" visible="false" style="background-color: Beige;
                        padding: 10px 10px 10px 10px">
                        The following error(s) occurred:
                        <br />
                        <div id="ErrorMessage" runat="server" style="color: Red; padding-left: 20px">
                        </div>
                    </div>
                    <div style="padding: 10px 0px 0px 10px">
                        <ClozWebControls:InputField ID="VendorName" runat="server" Title="Name:" MaxLength="40"
                            TitleWidth="50px" ValueWidth="200px" TabIndex="200" />
                    </div>
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
