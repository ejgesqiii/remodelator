<%@ Control Language="VB" AutoEventWireup="false" CodeFile="ItemAddEdit.ascx.vb"
    Inherits="Remodelator.ItemAddEdit" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/VendorAddEdit.ascx" TagName="VendorAddEdit" TagPrefix="uc1" %>
<div style="padding: 0px 0px 0px 0px">
    <div id="ItemInfoDiv" runat="server" style="width: 98%">
        <div id="ItemHeadingDiv" style="width: 100%">
            <div id="ErrorPanel" runat="server" visible="false" style="background-color: Beige;
                padding: 10px 10px 10px 10px">
                The following error(s) occurred:
                <br />
                <div id="ErrorMessage" runat="server" style="color: Red; padding-left: 20px">
                </div>
            </div>
            <div id="SuccessPanel" runat="server" visible="false" style="color: green; background-color: Beige;
                padding: 10px 10px 10px 10px">
            </div>
            <div id="ButtonPanel" runat="server" align="right" visible="false">
                <table style="padding: 10px 10px 5px 0px">
                    <tr>
                        <td align="right">
                            <div class="button">
                                <asp:LinkButton ID="btnSave" Text="Save" runat="server" Visible="false" Width="110px" /></div>
                        </td>
                        <td>
                            <div class="button">
                                <asp:LinkButton ID="btnCancel" Text="Cancel" runat="server" Visible="false" Width="100px"
                                    CausesValidation="false" /></div>
                        </td>
                    </tr>
                </table>
            </div>
            <div id="InfoDiv" class="AreaHeader">
                <table width="100%">
                    <tr>
                        <td>
                            <span class="AreaTitle">
                                <asp:Label ID="lblActionTitle" runat="server">Item Information:</asp:Label></span>
                        </td>
                        <td align="right">
                            <asp:LinkButton ID="btnViewCharges" Text="View Charges" runat="server" CssClass="LinkButtonStyle"
                                Visible="false" />
                            <asp:LinkButton ID="btnEditInfo" Text="Edit Info" runat="server" CssClass="LinkButtonStyle"
                                Visible="false" />
                        </td>
                    </tr>
                </table>
            </div>
            <div style="background-color: white; border: solid 2px #d4dfeb">
                <div id="PropertiesDiv" runat="server">
                    <fieldset style="margin: 0px 10px 0px 10px">
                        <legend><b>Properties</b></legend>
                        <div id="FolderDiv" runat="server">
                            <ClozWebControls:InputField ID="FolderName" runat="server" Title="Name:" MaxLength="40"
                                TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                            <ClozWebControls:InputField ID="FolderPosition" runat="server" Title="Node Position:"
                                MaxLength="40" TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                            <ClozWebControls:InputField ID="FolderParentNode" runat="server" Title="Parent Node ID:"
                                MaxLength="40" TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                            <ClozWebControls:InputField ID="FolderPrefix" runat="server" Title="Code Prefix:"
                                MaxLength="40" TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                        </div>
                        <div id="ItemDiv" runat="server">
                            <asp:CheckBox ID="EditsComplete" runat="server" Text="Edits Complete" />
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td colspan="2">
                                        <ClozWebControls:InputField ID="ItemCode" runat="server" Title="Item #:" MaxLength="40"
                                            TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top">
                                        <ClozWebControls:InputField ID="VendorCode" runat="server" Title="Manufacturer #:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="ItemDescription" runat="server" Title="Item Description:"
                                            MaxLength="80" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="ItemPosition" runat="server" Title="Node Position:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="ItemParentNode" runat="server" Title="Parent Node ID:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Units" runat="server" Title="Units:" MaxLength="40"
                                            TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Price" runat="server" Title="Part Price:" MaxLength="40"
                                            TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="ExtPrice" runat="server" Title="Aggregate Price:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <table>
                                            <tr>
                                                <td align="right" width="110px">
                                                    Manufacturer:</td>
                                                <td>
                                                    <ComponentArt:ComboBox ID="Vendors" runat="server" AutoHighlight="false" AutoComplete="true"
                                                        AutoFilter="true" DataTextField="Name" DataValueField="VendorID" CssClass="comboBox"
                                                        HoverCssClass="comboBoxHover" FocusedCssClass="comboBoxHover" TextBoxCssClass="comboTextBox"
                                                        TextBoxHoverCssClass="comboBoxHover" DropDownCssClass="comboDropDown" ItemCssClass="comboItem"
                                                        ItemHoverCssClass="comboItemHover" SelectedItemCssClass="comboItemHover" DropDownResizingMode="Corner"
                                                        DropHoverImageUrl="../Images/Combobox/drop_hover.gif" DropImageUrl="../Images/Combobox/drop.gif"
                                                        Width="200" Height="20px">
                                                    </ComponentArt:ComboBox>
                                                </td>
                                            </tr>
                                        </table>
                                        <ClozWebControls:InputField ID="Classes" runat="server" Title="Classification:" MaxLength="40"
                                            TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                    </td>
                                    <td valign="top">
                                        <ClozWebControls:InputField ID="RemUnits" runat="server" Title="Remodeler Units:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="100px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="ElecUnits" runat="server" Title="Electrician Units:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="100px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="PlumUnits" runat="server" Title="Plumber Units:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="100px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="TinUnits" runat="server" Title="Tinner Units:" MaxLength="40"
                                            TitleWidth="110px" ValueWidth="100px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="DesignUnits" runat="server" Title="Designer Units:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="100px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="RateDesc" runat="server" Title="Rate Description:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="LaborNotes" runat="server" Title="Labor Notes:" MaxLength="40"
                                            TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="LaborDescription" runat="server" Title="Labor Description:"
                                            MaxLength="40" TitleWidth="110px" ValueWidth="200px" TabIndex="200" />
                                    </td>
                                </tr>
                            </table>
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td valign="top" colspan="2">
                                        <ClozWebControls:InputField ID="Bullet1" runat="server" Title="Bullet 1:" MaxLength="80"
                                            TitleWidth="110px" ValueWidth="500px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Bullet2" runat="server" Title="Bullet 2:" MaxLength="80"
                                            TitleWidth="110px" ValueWidth="500px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Bullet3" runat="server" Title="Bullet 3:" MaxLength="80"
                                            TitleWidth="110px" ValueWidth="500px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Bullet4" runat="server" Title="Bullet 4:" MaxLength="80"
                                            TitleWidth="110px" ValueWidth="500px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Bullet5" runat="server" Title="Bullet 5:" MaxLength="80"
                                            TitleWidth="110px" ValueWidth="500px" TabIndex="200" />
                                        <ClozWebControls:InputField ID="Bullet6" runat="server" Title="Bullet 6:" MaxLength="80"
                                            TitleWidth="110px" ValueWidth="500px" TabIndex="200" />
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </fieldset>
                </div>
                <div id="ItemSettingsDiv" runat="server">
                    <fieldset style="margin: 5px 10px 0px 10px">
                        <legend><b>Images</b></legend>
                        <table>
                            <tr>
                                <td>
                                    <div style="padding: 5px; margin: 5px; background: #eee;">
                                        <table>
                                            <tr>
                                                <td>
                                                    Add New Image:
                                                    <input id="ImagePath" type="file" name="file_1" />
                                                </td>
                                                <td>
                                                    <asp:LinkButton ID="btnUploadImage" runat="server" Text="Upload"></asp:LinkButton></td>
                                            </tr>
                                        </table>
                                        <div id="files_list" style="border: 1px solid black; padding: 5px; background: #fff;
                                            font-size: x-small;">
                                            <strong>Files to Upload:</strong></div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                        <div id="ImageDiv" runat="server">
                            <hr />
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td colspan="3">
                                        <span class="FieldLabel">Current Images:</span>
                                        <asp:DataList ID="Images" runat="server" RepeatDirection="Horizontal" RepeatColumns="6"
                                            Style="margin-top: 10px">
                                            <ItemTemplate>
                                                <table width="100px">
                                                    <tr>
                                                        <td colspan="2">
                                                            <%#Eval("Path")%>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colspan="2">
                                                            <span onclick="window.open('<%# Eval("ImageID", "GetData.aspx?ImgID={0}") %>','ImgL','toolbar=no,locations=no,directories=no,status=no,menubar=no,width=500,height=500');">
                                                                <asp:Image ID="Image1" runat="Server" BorderWidth="0px" BorderStyle="Solid" BorderColor="black"
                                                                    ImageUrl='<%# Eval("ImageID", "~/WebPages/GetData.aspx?ImgID={0}&DoThumb=100") %> ' /></span><br />
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <asp:LinkButton ID="DeleteImage" runat="server" Text="Delete" CommandName="Delete"
                                                                OnClientClick="return confirm('Are you sure you want to delete this image?');"></asp:LinkButton></td>
                                                        <td width="30px">
                                                            <asp:TextBox ID="Position" runat="server" Style="height: 15px; width: 25px; text-align: center"
                                                                Text='<%# Eval("SeqNo") %>'></asp:TextBox></td>
                                                    </tr>
                                                </table>
                                            </ItemTemplate>
                                            <SeparatorTemplate>
                                                <div style="width: 15px">
                                                </div>
                                            </SeparatorTemplate>
                                        </asp:DataList>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </fieldset>
                    <fieldset style="margin: 5px 10px 0px 10px">
                        <legend><b>Documents</b></legend>
                        <table>
                            <tr>
                                <td>
                                    Add Document:<br />
                                    <asp:RadioButtonList ID="DocumentChoice" runat="server" RepeatDirection="Vertical">
                                        <asp:ListItem Text="Options" Value="0" Selected="true"></asp:ListItem>
                                        <asp:ListItem Text="Datasheet" Value="1"></asp:ListItem>
                                    </asp:RadioButtonList>
                                </td>
                                <td>
                                    <asp:FileUpload ID="DocumentPath" runat="server" />
                                    <asp:LinkButton ID="btnUploadDocument" runat="server" Text="Upload"></asp:LinkButton>
                                </td>
                            </tr>
                        </table>
                        <div id="DocumentDiv" runat="server">
                            <hr />
                            <table>
                                <tr>
                                    <td colspan="3">
                                        <span class="FieldLabel">Current Documents:</span>
                                        <asp:DataList ID="Documents" runat="server" RepeatDirection="Vertical" RepeatColumns="1"
                                            Style="margin-top: 5px" CellPadding="0" CellSpacing="0">
                                            <ItemTemplate>
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td>
                                                            <a href='<%# Eval("DocumentID", "../WebPages/GetData.aspx?DocID={0}") %>' target="_blank">
                                                                <asp:Image ID="Image1" runat="Server" BorderWidth="1px" BorderStyle="Solid" BorderColor="black"
                                                                    ImageUrl="~/Images/reader_icon.jpg" Width="20px" Height="20px" /><br />
                                                            </a>
                                                        </td>
                                                        <td>
                                                            &nbsp;<%#IIf(Eval("IsOptionPdf"), "(Options)", "(Datasheet)")%>
                                                            &nbsp;<%#Eval("Path")%>
                                                        </td>
                                                        <td style="width: 15px">
                                                        </td>
                                                        <td>
                                                            <asp:LinkButton ID="DeleteDocument" runat="server" Text="Delete" CommandName="Delete"
                                                                OnClientClick="return confirm('Are you sure you want to delete this Document?');"></asp:LinkButton></td>
                                                    </tr>
                                                </table>
                                            </ItemTemplate>
                                        </asp:DataList>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </fieldset>
                    <div id="AccessoryDiv" runat="server">
                        <fieldset style="margin: 5px 10px 0px 10px">
                            <legend><b>Accessories</b></legend>
                            <asp:GridView ID="XGrid" runat="server" AutoGenerateColumns="false" DataKeyNames="ItemId"
                                ForeColor="#333333" BackColor="White" Style="margin-top: 5px">
                                <Columns>
                                    <asp:BoundField HeaderText="ItemID" DataField="ItemID" Visible="false" />
                                    <asp:TemplateField HeaderText="Select">
                                        <ItemTemplate>
                                            <asp:CheckBox ID="chkSelect" runat="server" />
                                        </ItemTemplate>
                                        <HeaderTemplate>
                                            <input id="chkAll" onclick="javascript:SelectAllCheckboxes(this);" runat="server"
                                                type="checkbox" />
                                        </HeaderTemplate>
                                    </asp:TemplateField>
                                    <asp:BoundField HeaderText="Item Code" DataField="ItemCode" ItemStyle-Width="150px"
                                        ItemStyle-HorizontalAlign="center" />
                                    <asp:BoundField HeaderText="Name" DataField="Name" ItemStyle-Width="500px" />
                                    <asp:TemplateField HeaderText="Price" Visible="true">
                                        <ItemTemplate>
                                            <%# GetPrice(Eval("ItemID")) %>
                                        </ItemTemplate>
                                    </asp:TemplateField>
                                    <asp:TemplateField HeaderText="">
                                        <ItemTemplate>
                                            <%# GetImageHtml(Eval("ItemID")) %>
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
                                    <i>No item accessories are available to be associated with this item.</i>
                                </EmptyDataTemplate>
                            </asp:GridView>
                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
        <div id="ButtonPanel2" runat="server" align="right">
            <table style="padding: 10px 10px 5px 0px">
                <tr>
                    <td align="right">
                        <div class="button">
                            <asp:LinkButton ID="btnSaveNext2" Text="Save Next" runat="server" Visible="true"
                                Width="75px" /></div>
                    </td>
                    <td align="right">
                        <div class="button">
                            <asp:LinkButton ID="btnSave2" Text="Save" runat="server" Visible="true" Width="75px" /></div>
                    </td>
                    <td>
                        <div class="button">
                            <asp:LinkButton ID="btnCancel2" Text="Cancel" runat="server" Visible="true" Width="75px"
                                CausesValidation="false" /></div>
                    </td>
                    <td>
                        <div class="button">
                            <asp:LinkButton ID="btnDelete2" Text="Delete" runat="server" Visible="true" Width="75px"
                                CausesValidation="false" /></div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</div>
<!-- Markup and script for Vendor editing modal content -->
<div id="ModalContent" style="display: none">
    <uc1:VendorAddEdit ID="ucVendorAddEdit" runat="server" />
</div>
