<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Estimate.aspx.vb" Inherits="Remodelator.Estimate"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div style="padding: 0px 5px 0px 5px">
        <div id="JobBanner" runat="server" class="JobHeader">
        </div>
        <div id="ErrorPanel" runat="server" visible="false" style="background-color: Beige;
            padding: 10px 10px 10px 10px">
            The following error(s) occurred:
            <br />
            <div id="ErrorMessage" runat="server" style="color: Red; padding-left: 20px">
            </div>
        </div>
        <div id="EditPanel" runat="server" style="width: 800px">
            <fieldset>
                <legend><b>Edit Item</b></legend>
                <table border="0" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <ClozWebControls:InputField ID="Name" runat="server" Title="Item:" MaxLength="40"
                                TitleWidth="70px" ValueWidth="300px" TabIndex="200" />
                        </td>
                        <td align="right">
                            <table>
                                <tr>
                                    <td>
                                        Item Group:</td>
                                    <td>
                                        <ComponentArt:ComboBox ID="ItemGroups" runat="server" AutoHighlight="false" AutoComplete="true"
                                            AutoFilter="true" DataTextField="Name" DataValueField="GroupID" CssClass="comboBox"
                                            HoverCssClass="comboBoxHover" FocusedCssClass="comboBoxHover" TextBoxCssClass="comboTextBox"
                                            TextBoxHoverCssClass="comboBoxHover" DropDownCssClass="comboDropDown" ItemCssClass="comboItem"
                                            ItemHoverCssClass="comboItemHover" SelectedItemCssClass="comboItemHover" DropDownResizingMode="Corner"
                                            DropHoverImageUrl="../Images/Combobox/drop_hover.gif" DropImageUrl="../Images/Combobox/drop.gif"
                                            Width="200" Height="20px">
                                        </ComponentArt:ComboBox>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <ClozWebControls:InputField ID="Comment" runat="server" Title="Comment:" MaxLength="255"
                                TitleWidth="70px" ValueWidth="650" TabIndex="200" RequiredField="false" MultiLine="true"
                                Rows="2" />
                        </td>
                    </tr>
                    <tr>
                        <td valign="top">
                            <table>
                                <tr>
                                    <td>
                                        <ClozWebControls:InputField ID="Qty" runat="server" Title="Quantity:" MaxLength="40"
                                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                                    </td>
                                    <td colspan="2">
                                        <ClozWebControls:InputField ID="ExtPrice" runat="server" Title="Material:" MaxLength="40"
                                            TitleWidth="70px" ValueWidth="75px" TabIndex="200" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <ClozWebControls:InputField ID="RemUnits" runat="server" Title="Remodeler:" MaxLength="40"
                                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                                    </td>
                                    <td>
                                        <ClozWebControls:InputField ID="ElecUnits" runat="server" Title="Electrical:" MaxLength="40"
                                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                                    </td>
                                    <td>
                                        <ClozWebControls:InputField ID="PlumUnits" runat="server" Title="Plumber:" MaxLength="40"
                                            TitleWidth="60px" ValueWidth="50px" TabIndex="200" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <ClozWebControls:InputField ID="TinUnits" runat="server" Title="Tinner:" MaxLength="40"
                                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                                    </td>
                                    <td colspan="2">
                                        <ClozWebControls:InputField ID="DesignUnits" runat="server" Title="Designer:" MaxLength="40"
                                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td valign="top">
                            <table>
                                <tr>
                                    <td>
                                        <fieldset>
                                            <legend><b>Markup</b></legend>
                                            <ClozWebControls:InputField ID="MaterialMarkup" runat="server" Title="Material:"
                                                MaxLength="40" TitleWidth="90px" ValueWidth="50px" TabIndex="200" />
                                            <ClozWebControls:InputField ID="LaborMarkup" runat="server" Title="Labor:" MaxLength="40"
                                                TitleWidth="90px" ValueWidth="50px" TabIndex="200" />
                                            <ClozWebControls:InputField ID="SubMarkup" runat="server" Title="Subcontractor:"
                                                MaxLength="40" TitleWidth="90px" ValueWidth="50px" TabIndex="200" />
                                        </fieldset>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="right" colspan="2">
                            <asp:LinkButton ID="btnSave" Text="Save" runat="server" />
                            <asp:LinkButton ID="btnCancel" Text="Cancel" runat="server" CausesValidation="false" /></td>
                    </tr>
                </table>
                <asp:HiddenField ID="Price_val" runat="server" />
            </fieldset>
        </div>
        <table>
            <tr>
                <td align="right">
                    <asp:Label ID="TotalPrice" runat="server" Font-Bold="true"></asp:Label>
                </td>
            </tr>
            <tr>
                <td>
                    <div id="OrderItemsScroll" class="ItemsMaxArea" onmouseup="SaveOrderItemsScrollPos();"
                        onmouseleave="SaveOrderItemsScrollPos();">
                        <asp:GridView ID="EstimateGrid" runat="server" AutoGenerateColumns="False" AllowSorting="False"
                            DataKeyNames="LineID" Style="border: solid 2px #d4dfeb;" Width="800px">
                            <Columns>
                                <asp:TemplateField ItemStyle-Width="65px" ItemStyle-HorizontalAlign="right">
                                    <ItemTemplate>
                                        <asp:LinkButton ID="btnView" runat="server" Text="View" CausesValidation="false"
                                            CommandName="View" CommandArgument='<%# Eval("LineID") %>' CssClass="Link1" Visible="false"></asp:LinkButton>
                                        <asp:LinkButton ID="btnEdit" runat="server" Text="Edit" CausesValidation="false"
                                            CommandName="Edit" CssClass="Link1"></asp:LinkButton>
                                        <asp:LinkButton ID="btnDelete" runat="server" Text="Delete" CausesValidation="false"
                                            CssClass="Link1" CommandName="Delete" OnClientClick="return confirm('Are you sure you want to delete this item? This action cannot be undone.');"></asp:LinkButton>
                                    </ItemTemplate>
                                    <EditItemTemplate>
                                    </EditItemTemplate>
                                </asp:TemplateField>
                                <asp:BoundField DataField="LineID" Visible="False" ReadOnly="true" />
                                <asp:BoundField DataField="Name" HeaderText="Item" ReadOnly="true" ItemStyle-HorizontalAlign="left" />
                                <asp:BoundField DataField="Comments" HeaderText="Comment" ReadOnly="true" ItemStyle-HorizontalAlign="left" />
                                <asp:BoundField DataField="Qty" HeaderText="Qty" ReadOnly="true" />
                                <asp:BoundField DataField="NetPrice" HeaderText="Price" ReadOnly="true" DataFormatString="{0:c}"
                                    HtmlEncode="false" HeaderStyle-HorizontalAlign="right" ItemStyle-HorizontalAlign="right"
                                    ItemStyle-Width="80px" />
                                <asp:BoundField DataField="ExtPrice" HeaderText="Ext Price" ReadOnly="true" DataFormatString="{0:c}"
                                    HtmlEncode="false" HeaderStyle-HorizontalAlign="right" ItemStyle-HorizontalAlign="right"
                                    ItemStyle-Width="80px" />
                            </Columns>
                            <EmptyDataTemplate>
                                No items have been added to this estimate.
                            </EmptyDataTemplate>
                            <RowStyle HorizontalAlign="Center" />
                            <SelectedRowStyle BackColor="#98AFC7" />
                            <EmptyDataRowStyle CssClass="EmptyGridRow" />
                        </asp:GridView>
                    </div>
                </td>
            </tr>
        </table>
        <input id="OrderItemsScrollPos" name="OrderItemsScrollPos" type="hidden" />
    </div>
</asp:Content>
