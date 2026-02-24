<%@ Control Language="VB" AutoEventWireup="false" CodeFile="ItemDetail.ascx.vb" Inherits="Remodelator.ItemDetail" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<div style="padding: 0px 0px 10px 0px">
    <div id="ItemInfoDiv" runat="server" style="width: 100%">
        <table style="width: 100%">
            <tr>
                <td valign="top">
                    <fieldset>
                        <legend><b>Item Details</b></legend>
                        <table style="margin-top: 5px">
                            <tr valign="top">
                                <td width="250px">
                                    <asp:Label ID="Title" runat="server" Font-Bold="true" Font-Size="12px"></asp:Label>
                                    <asp:BulletedList ID="ItemBullets" runat="server" DisplayMode="Text" Font-Size="12px">
                                    </asp:BulletedList>
                                </td>
                                <td>
                                    <asp:Image ID="MainImage" runat="server" BorderColor="1"
                                        BorderStyle="solid" BorderWidth="1px" />
                                </td>
                                <td>
                                    <asp:Image ID="SecondImage" runat="server" BorderColor="1"
                                        BorderStyle="solid" BorderWidth="1px" /></td>
                                <td>
                                    <table>
                                        <tr>
                                            <td>
                                                <asp:Image ID="Thumb1" runat="server" BorderColor="1" BorderStyle="solid"
                                                    BorderWidth="1px" /></td>
                                            <td>
                                                <asp:Image ID="Thumb2" runat="server" BorderColor="1" BorderStyle="solid"
                                                    BorderWidth="1px" /></td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <asp:Image ID="Thumb3" runat="server" BorderColor="1" BorderStyle="solid"
                                                    BorderWidth="1px" />
                                            </td>
                                            <td>
                                                <asp:Image ID="Thumb4" runat="server" BorderColor="1" BorderStyle="solid"
                                                    BorderWidth="1px" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <ClozWebControls:InputField ID="Price" runat="server" Title="Installed Price:" MaxLength="10"
                                        TitleWidth="90px" ValueWidth="200px" TabIndex="200" ReadOnly="true" />
                                </td>
                            </tr>
                        </table>
                </td>
            </tr>
        </table>
    </div>
</div>
