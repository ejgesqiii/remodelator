<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Bath.aspx.vb" Inherits="Remodelator.Bath"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register Src="../UserControls/ItemBrowser.ascx" TagName="ItemBrowser" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <asp:ScriptManager ID="ScriptManager" runat="server" EnablePartialRendering="true" />
    <div ID="JobBanner" runat="server" class="JobHeader">
    </div>
    <div id="lblTitle" runat="server" class="DivHeader">
        Bath Page
    </div>
    <div id="NoUser" runat="server">
        <table style="border: 1px solid black; height: 300px; font-size: 12px; font-weight: bold">
            <tr>
                <td align="center" style="border-right: 1px solid black" width="300px">
                    Entry Level Baths</td>
                <td align="center" width="300px">
                    Baths of Distinction</td>
            </tr>
        </table>
    </div>
    <div id="ValidUser" runat="server">
        <uc1:ItemBrowser ID="ucItemBrowser" runat="server" />
    </div>
</asp:Content>
