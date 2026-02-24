<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Landscaping.aspx.vb" Inherits="Remodelator.Landscaping"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register Src="../UserControls/ItemBrowser.ascx" TagName="ItemBrowser" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <asp:ScriptManager ID="ScriptManager" runat="server" EnablePartialRendering="true" />
    <div ID="JobBanner" runat="server" class="JobHeader">
    </div>
    <div id="lblTitle" runat="server" class="DivHeader">
        Landscaping Page
    </div>
    <div id="NoUser" runat="server">
        <table style="border: 1px solid black; height: 300px; font-size: 12px; font-weight: bold"
            cellpadding="0" cellspacing="0" visible="false">
            <tr>
                <td align="center" style="border-right: 1px solid black; border-bottom: 1px solid black"
                    width="250px">
                    Trees & Shrubs</td>
                <td align="center" style="border-right: 1px solid black; border-bottom: 1px solid black"
                    width="250px">
                    Plants & Flowers</td>
                <td align="center" style="border-bottom: 1px solid black" width="250px">
                    Sprinkler Systems</td>
            </tr>
        </table>
    </div>
    <div id="ValidUser" runat="server">
        <uc1:ItemBrowser ID="ucItemBrowser" runat="server" />
    </div>
</asp:Content>
