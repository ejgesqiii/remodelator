<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Estimate2.aspx.vb" Inherits="Remodelator.Estimate2"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div id="JobBanner" runat="server" class="JobHeader">
    </div>
    <div class="DivHeader">
        <asp:Label ID="lblTitle" runat="server">Create New Proposal</asp:Label>
    </div>
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
    <ClozWebControls:InputField ID="proposalName" runat="server" Title="Proposal Name:"
        MaxLength="30" TitleWidth="110px" ValueWidth="150px" TabIndex="1" />
    <table style="margin-top: 10px">
        <tr>
            <td valign="top" width="400px">
                <fieldset>
                    <legend><b>Client Information</b></legend>
                    <ClozWebControls:InputField ID="firstName" runat="server" Title="First Name:" MaxLength="30"
                        TitleWidth="100px" ValueWidth="200px" TabIndex="1" />
                    <ClozWebControls:InputField ID="lastName" runat="server" Title="Last Name:" MaxLength="80"
                        TitleWidth="100px" ValueWidth="200px" TabIndex="1" />
                    <ClozWebControls:InputField ID="address1" runat="server" Title="Address1:" MaxLength="50"
                        TitleWidth="100px" ValueWidth="200px" TabIndex="2" />
                    <ClozWebControls:InputField ID="address2" runat="server" Title="Address2:" MaxLength="50"
                        TitleWidth="100px" ValueWidth="200px" RequiredField="false" TabIndex="3" />
                    <ClozWebControls:InputField ID="city" runat="server" Title="City:" MaxLength="50"
                        TitleWidth="100px" ValueWidth="200px" TabIndex="4" />
                    <ClozWebControls:InputField ID="state" runat="server" Title="State:" MaxLength="2"
                        TitleWidth="100px" ValueWidth="75px" TabIndex="5" />
                    <ClozWebControls:InputField ID="country" runat="server" Title="Country:" MaxLength="30"
                        TitleWidth="100px" ValueWidth="175px" AutoPostBack="False" 
                        TabIndex="6" />
                    <ClozWebControls:InputField ID="zipcode" runat="server" Title="Zip/Postal:" MaxLength="10"
                        TitleWidth="100px" ValueWidth="75px" FormatType="Zipcode" AutoPostBack="false"
                        TabIndex="6" />
                    <ClozWebControls:InputField ID="phone" runat="server" Title="Phone:" MaxLength="20"
                        TitleWidth="100px" ValueWidth="150px" FormatType="Phone" AutoPostBack="false"
                        TabIndex="6" />
                    <ClozWebControls:InputField ID="phoneEve" runat="server" Title="Eve Phone:" MaxLength="20"
                        TitleWidth="100px" ValueWidth="150px" FormatType="Phone" AutoPostBack="false"
                        RequiredField="false" TabIndex="6" />
                    <ClozWebControls:InputField ID="fax" runat="server" Title="Fax:" MaxLength="20" TitleWidth="100px"
                        ValueWidth="150px" FormatType="Phone" AutoPostBack="false" RequiredField="false"
                        TabIndex="6" />
                    <ClozWebControls:InputField ID="email" runat="server" Title="Email:" MaxLength="30"
                        TitleWidth="100px" ValueWidth="150px" AutoPostBack="false" RequiredField="false"
                        TabIndex="6" />
                </fieldset>
            </td>
            <td valign="top" width="200px">
                <fieldset>
                    <legend><b>Billing Rates</b></legend>
                    <ClozWebControls:InputField ID="RemodelerRate" runat="server" Title="Remodeler:"
                        MaxLength="8" TitleWidth="100px" ValueWidth="75px" TabIndex="20" />
                    <ClozWebControls:InputField ID="PlumberRate" runat="server" Title="Plumber:" MaxLength="8"
                        TitleWidth="100px" ValueWidth="75px" TabIndex="21" />
                    <ClozWebControls:InputField ID="TinnerRate" runat="server" Title="Tinner:" MaxLength="8"
                        TitleWidth="100px" ValueWidth="75px" TabIndex="22" />
                    <ClozWebControls:InputField ID="ElectricianRate" runat="server" Title="Electrician:"
                        MaxLength="8" TitleWidth="100px" ValueWidth="75px" TabIndex="23" />
                    <ClozWebControls:InputField ID="DesignerRate" runat="server" Title="Designer:" MaxLength="8"
                        TitleWidth="100px" ValueWidth="75px" TabIndex="23" />
                </fieldset>
                <fieldset style="margin-top: 10px">
                    <legend><b>Markups</b></legend>
                    <ClozWebControls:InputField ID="MaterialMarkup" runat="server" Title="Material:"
                        MaxLength="4" TitleWidth="100px" ValueWidth="75px" TabIndex="24" />
                    <ClozWebControls:InputField ID="LaborMarkup" runat="server" Title="Labor:" MaxLength="4"
                        TitleWidth="100px" ValueWidth="75px" TabIndex="25" />
                    <ClozWebControls:InputField ID="SubMarkup" runat="server" Title="Subcontractor:"
                        MaxLength="4" TitleWidth="100px" ValueWidth="75px" TabIndex="25" />
                </fieldset>
                <span id="RateChangeWarning" runat="server" style="color:red" valign="top">WARNING! Changes to Billing Rates and Markups will be applied to all current items in the estimate, even if you've overridden line item Billing Rates and/or Markups.</span>
            </td>
            
        </tr>
        <tr id="ItemGroupsPanel" runat="server">
            <td valign="top" width="400px">
                <fieldset>
                    <legend><b>Item Groups</b></legend>
                    <div id="ItemGroupMessage" runat="server" style="color: Red" />
                    <table id="AddGroupPanel" runat="server">
                        <tr>
                            <td>
                                <ClozWebControls:InputField ID="GroupName" runat="server" Title="New Group:" TitleWidth="70px"
                                    ValueWidth="175px" TabIndex="25" RequiredField="false" MaxLength="50" />
                            </td>
                            <td>
                                <asp:LinkButton ID="btnAddGroup" runat="server" Text="Create"></asp:LinkButton></td>
                        </tr>
                    </table>
                    <asp:DataGrid ID="GroupsGrid" runat="server" AutoGenerateColumns="False" CellPadding="4"
                        HeaderStyle-BackColor="Black" HeaderStyle-ForeColor="White" HeaderStyle-HorizontalAlign="Center"
                        HeaderStyle-Font-Bold="True" DataKeyField="GroupID">
                        <Columns>
                            <asp:EditCommandColumn EditText="Edit" ButtonType="linkButton" UpdateText="Update"
                                CancelText="Cancel" />
                            <asp:ButtonColumn ButtonType="LinkButton" Text="Delete" CommandName="Delete"></asp:ButtonColumn>
                            <asp:BoundColumn HeaderText="Name" DataField="Name" ItemStyle-Width="100%" />
                        </Columns>
                    </asp:DataGrid>
                    <asp:label ID="NoItemGroups" runat="server" ForeColor="red" Font-Italic="true" Text="There are currently no item groups defined in this estimate."></asp:label>
                </fieldset>
            </td>
            <td>
                &nbsp;</td>
        </tr>
    </table>
    <div id="ButtonPanel2" runat="server" align="right">
        <table style="padding: 10px 10px 5px 0px">
            <tr>
                <td align="right">
                    <div class="button">
                        <asp:LinkButton ID="btnSave" Text="Save" runat="server" Visible="true" Width="75px" /></div>
                </td>
                <td>
                    <div class="button">
                        <asp:LinkButton ID="btnCancel" Text="Cancel" runat="server" Visible="true" Width="75px"
                            CausesValidation="false" /></div>
                </td>
                <td>
                    <div class="button">
                        <asp:LinkButton ID="btnCreate" Text="Create Estimate" runat="server" Visible="true" Width="125px"
                            CausesValidation="false" /></div>
                </td>
            </tr>
        </table>
    </div>
</asp:Content>
