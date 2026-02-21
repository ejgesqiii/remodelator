<%@ Control Language="VB" AutoEventWireup="false" CodeFile="ItemSelect.ascx.vb" Inherits="Remodelator.ItemSelect" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<div style="padding: 0px 0px 10px 0px">
    <div id="PleaseSelectDiv" runat="server" style="width: 100%">
        Please select an item from the tree on the left
    </div>
    <div id="ItemInfoDiv" runat="server" style="width: 98%">
        <table style="width: 100%">
            <tr>
                <td>
                    <div id="MessagePanel" runat="server" visible="false" style="font-weight: bold; color: green;
                        background-color: Beige; padding: 10px 10px 10px 10px">
                    </div>
                    <div id="ErrorPanel" runat="server" visible="false" style="background-color: Beige;
                        padding: 10px 10px 10px 10px">
                        The following error(s) occurred:
                        <br />
                        <div id="ErrorMessage" runat="server" style="color: Red; padding-left: 20px">
                        </div>
                    </div>
                    <div id="DuplicateItem" runat="server" style="font-weight: bold; color: green; background-color: Beige;
                        padding: 10px 10px 10px 10px">
                        This item has already been added to your estimate. Do you wish to replace the information
                        in your estimate with the details you've provided below?
                        <asp:LinkButton ID="btnReplaceDup" runat="server" Text="Yes"></asp:LinkButton>
                        <asp:LinkButton ID="btnNo" runat="server" Text="No"></asp:LinkButton>
                    </div>
                </td>
            </tr>
            <tr>
                <td valign="top">
                    <fieldset>
                        <legend><b>Item Details</b></legend>
                        <table style="margin-top: 5px">
                            <tr valign="top">
                                <td style="padding-right: 10px">
                                    <asp:Label ID="Title" runat="server" Font-Bold="true" Font-Size="12px"></asp:Label>
                                    <asp:BulletedList ID="ItemBullets" runat="server" DisplayMode="Text" Font-Size="12px">
                                    </asp:BulletedList>
                                    <div id="DocumentDiv" runat="server">
                                        <asp:DataList ID="Documents" runat="server" RepeatDirection="Vertical" RepeatColumns="1"
                                            Style="margin-top: 5px" CellPadding="0" CellSpacing="0">
                                            <ItemTemplate>
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td>
                                                            <a href='<%# Eval("DocumentID", ConvertToAbsoluteUrl("../WebPages/GetData.aspx?DocID={0}")) %>' target="_blank">
                                                                <asp:Image ID="Image1" runat="Server" BorderWidth="1px" BorderStyle="Solid" BorderColor="black"
                                                                    ImageUrl="~/Images/reader_icon.jpg" Width="20px" Height="20px" /><br />
                                                            </a>
                                                        </td>
                                                        <td>
                                                            &nbsp;<%#IIf(Eval("IsOptionPdf"), "(Options)", "(Datasheet)")%>
                                                            &nbsp;<%#Eval("Path")%>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </ItemTemplate>
                                        </asp:DataList>
                                    </div>
                                </td>
                                <td>
                                    <asp:Image ID="MainImage" runat="server" BorderColor="1" BorderStyle="solid" BorderWidth="1px" ToolTip="Click to Enlarge" />
                                </td>
                                <td>
                                    <asp:Image ID="SecondImage" runat="server" BorderColor="1" BorderStyle="solid" BorderWidth="1px" /></td>
                                <td>
                                    <table>
                                        <tr>
                                            <td>
                                                <asp:Image ID="Thumb1" runat="server" BorderColor="1" BorderStyle="solid" BorderWidth="1px" /></td>
                                            <td>
                                                <asp:Image ID="Thumb2" runat="server" BorderColor="1" BorderStyle="solid" BorderWidth="1px" /></td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <asp:Image ID="Thumb3" runat="server" BorderColor="1" BorderStyle="solid" BorderWidth="1px" />
                                            </td>
                                            <td>
                                                <asp:Image ID="Thumb4" runat="server" BorderColor="1" BorderStyle="solid" BorderWidth="1px" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr id="ItemGroupDiv" runat="server">
                                <td colspan="4">
                                    <table>
                                        <tr>
                                            <td style="width: 80px" align="right" nowrap>
                                                Item Group:</td>
                                            <td>
                                                <ComponentArt:ComboBox ID="ItemGroups" runat="server" AutoHighlight="false" AutoComplete="true"
                                                    AutoFilter="true" DataTextField="Name" DataValueField="GroupID" CssClass="comboBox"
                                                    HoverCssClass="comboBoxHover" FocusedCssClass="comboBoxHover" TextBoxCssClass="comboTextBox"
                                                    TextBoxHoverCssClass="comboBoxHover" DropDownCssClass="comboDropDown" ItemCssClass="comboItem"
                                                    ItemHoverCssClass="comboItemHover" SelectedItemCssClass="comboItemHover" DropDownResizingMode="Corner"
                                                    DropHoverImageUrl="../Images/Combobox/drop_hover.gif" DropImageUrl="../Images/Combobox/drop.gif"
                                                    Width="200" height="20px">
                                                </ComponentArt:ComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" valign="top">
                                                <ClozWebControls:InputField ID="Price" runat="server" Title="Price:" MaxLength="10"
                                                    TitleWidth="80px" ValueWidth="200px" TabIndex="200" ReadOnly="true" />
                                                <ClozWebControls:InputField ID="Quantity" runat="server" Title="Quantity:" MaxLength="3"
                                                    TitleWidth="80px" ValueWidth="40px" TabIndex="200" ReadOnly="false" />
                                            </td>
                                            <td colspan="2" valign="top">
                                                <ClozWebControls:InputField ID="Comment" runat="server" Title="Comment:" MultiLine="true"
                                                    Rows="3" MaxLength="255" TitleWidth="80px" ValueWidth="300px" TabIndex="200"
                                                    ReadOnly="false" RequiredField="false" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="4">
                                    <asp:LinkButton ID="btnAddItem" runat="server" Text="Add To Estimate" /><br />
                                </td>
                            </tr>
                        </table>
                    </fieldset>
                    <div>
                        <div id="AccessoryDiv" runat="server">
                            <fieldset>
                                <legend><b>Accessories</b></legend>
                                <asp:GridView ID="XGrid" runat="server" AutoGenerateColumns="false" DataKeyNames="ItemId"
                                    ForeColor="#333333" BackColor="White" Style="margin-top: 5px" Width="100%">
                                    <Columns>
                                        <asp:TemplateField HeaderText="Select">
                                            <HeaderTemplate>
                                                <input id="chkAll" onclick="javascript:SelectAllCheckboxes(this);" runat="server"
                                                    type="checkbox" />
                                            </HeaderTemplate>
                                            <ItemTemplate>
                                                <asp:CheckBox ID="chkSelect" runat="server" />
                                            </ItemTemplate>
                                        </asp:TemplateField>
                                        <asp:BoundField HeaderText="ItemID" DataField="ItemID" Visible="false" />
                                        <asp:BoundField HeaderText="Item Code" DataField="ItemCode" ItemStyle-Width="150px"
                                            ItemStyle-HorizontalAlign="center" />
                                        <asp:BoundField HeaderText="Name" DataField="Name" />
                                        <asp:TemplateField HeaderText="Qty" ItemStyle-Width="40px" ItemStyle-HorizontalAlign="center">
                                            <ItemTemplate>
                                                <asp:TextBox ID="txtQty" runat="Server" Width="30px" Text="0"></asp:TextBox>
                                            </ItemTemplate>
                                        </asp:TemplateField>
                                        <asp:TemplateField HeaderText="Price" ItemStyle-Width="60px" ItemStyle-HorizontalAlign="center"
                                            Visible="true">
                                            <ItemTemplate>
                                                <%#GetPrice(Eval("ItemID"))%>
                                            </ItemTemplate>
                                        </asp:TemplateField>
                                        <asp:TemplateField HeaderText="" ItemStyle-Width="50px">
                                            <ItemTemplate>
                                                <span onclick="window.open('<%# Eval("ItemID", "GetData.aspx?ItemID={0}") %>','ImgL','toolbar=no,locations=no,directories=no,status=no,menubar=no,width=500,height=500');">
                                                    <asp:Image ID="XImage" runat="Server" BorderWidth="0px" BorderStyle="Solid" BorderColor="black" /></span>
                                            </ItemTemplate>
                                        </asp:TemplateField>
                                        <asp:TemplateField HeaderText="" ItemStyle-Width="70px" ItemStyle-HorizontalAlign="center">
                                            <ItemTemplate>
                                                <span onclick="javascript:window.open('ItemView.aspx?ID=<%# Eval("NodeID") %>','AccDetail','toolbar=no,locations=no,directories=no,status=no,menubar=no,width=650,height=300')"
                                                    style="text-decoration: underline; color: Blue; cursor: pointer">See Detail</span>
                                            </ItemTemplate>
                                        </asp:TemplateField>
                                    </Columns>
                                    <FooterStyle BackColor="#990000" Font-Bold="True" ForeColor="White" />
                                    <RowStyle BackColor="#F7F6F3" ForeColor="#333333" />
                                    <PagerStyle BackColor="#FFCC66" ForeColor="#333333" HorizontalAlign="Center" />
                                    <SelectedRowStyle BackColor="#FFCC66" Font-Bold="True" ForeColor="Navy" />
                                    <HeaderStyle BackColor="#5D7B9D" Font-Bold="True" ForeColor="White" />
                                    <AlternatingRowStyle BackColor="White" ForeColor="#284775" />
                                    <EmptyDataTemplate>
                                        <i>No item accessories are available for this item.</i>
                                    </EmptyDataTemplate>
                                </asp:GridView>
                            </fieldset>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>
