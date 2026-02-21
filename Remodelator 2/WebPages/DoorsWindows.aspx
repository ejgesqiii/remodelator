<%@ Page Language="VB" AutoEventWireup="false" CodeFile="DoorsWindows.aspx.vb" Inherits="Remodelator.DoorsWindows"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register Src="../UserControls/ItemBrowser.ascx" TagName="ItemBrowser" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <asp:ScriptManager ID="ScriptManager" runat="server" EnablePartialRendering="true" />
    <div ID="JobBanner" runat="server" class="JobHeader">
    </div>
    <div id="lblTitle" runat="server" class="DivHeader">
        Doors & Windows Page
    </div>
    <div id="NoUser" runat="server">
        <table style="border: 1px solid black; height: 300px; font-size: 12px; font-weight: bold">
            <tr>
                <td align="center" width="300px">
                    Doors & Windows from Start To Finish</td>
            </tr>
        </table>
    </div>
    <div id="ValidUser" runat="server">
        <uc1:ItemBrowser ID="ucItemBrowser" runat="server" />
    </div>
</asp:Content>
