<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Audit.aspx.vb" Inherits="Remodelator.Audit"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <fieldset>
        <legend><b>Search Criteria</b></legend>User Name:
        <asp:DropDownList ID="UserName" runat="server">
        </asp:DropDownList>
        Start Date:
        <asp:TextBox ID="StartDate" runat="server"></asp:TextBox>
        End Date:
        <asp:TextBox ID="EndDate" runat="server"></asp:TextBox>
        <asp:Button ID="Search" runat="Server" Text="Search" />
    </fieldset>
    <asp:GridView ID="AuditGrid" runat="server" AutoGenerateColumns="false" ForeColor="#333333"
        Style="margin-top: 5px" Width="900px">
        <Columns>
            <asp:BoundField HeaderText="User Name" DataField="Name" ItemStyle-Wrap="false" />
            <asp:BoundField HeaderText="Node Name" DataField="NodeName" />
            <asp:BoundField HeaderText="Node Type" DataField="NodeType" />
            <asp:BoundField HeaderText="Action" DataField="Action" />
            <asp:BoundField HeaderText="Date" DataField="Date" ItemStyle-Wrap="false" />
        </Columns>
        <FooterStyle BackColor="#990000" Font-Bold="True" ForeColor="White" />
        <RowStyle BackColor="#F7F6F3" ForeColor="#333333" />
        <PagerStyle BackColor="#FFCC66" ForeColor="#333333" HorizontalAlign="Center" />
        <SelectedRowStyle BackColor="#FFCC66" Font-Bold="True" ForeColor="Navy" />
        <HeaderStyle BackColor="#5D7B9D" Font-Bold="True" ForeColor="White" />
        <AlternatingRowStyle BackColor="White" ForeColor="#284775" />
        <EmptyDataTemplate>
            <i>No audit log data was found using the criteria you specified.</i>
        </EmptyDataTemplate>
    </asp:GridView>
</asp:Content>
