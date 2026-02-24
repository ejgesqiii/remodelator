<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Admin.aspx.vb" Inherits="Remodelator.Admin"
    MasterPageFile="~/MasterPages/site.master" EnableEventValidation="false" EnableViewState="true" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemConfig.ascx" TagName="ItemConfig" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <!-- needed for update panels in Admin user control -->
    <asp:ScriptManager ID="ScriptManager" runat="server" EnablePartialRendering="true" />
    <div>
        <asp:Button ID="btnRefresh" runat="server" Text="Refresh" Visible="false" />
    </div>
    <ComponentArt:TabStrip ID="TabStrip1" CssClass="TopGroup"  SiteMapXmlFile="tabdata.xml"
        DefaultGroupCssClass="TopGroup" DefaultItemLookId="TopLevelTabLook" DefaultSelectedItemLookId="SelectedTopLevelTabLook"
        DefaultChildSelectedItemLookId="SelectedTopLevelTabLook" DefaultGroupTabSpacing="0"
        ImagesBaseUrl="images/" runat="server" EnableViewState="true" runat="server"
        AutoPostBackOnSelect="true">
        <ItemLooks>
            <ComponentArt:ItemLook LookId="TopLevelTabLook" CssClass="TopLevelTab" HoverCssClass="TopLevelTabHover"
                LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4" />
            <ComponentArt:ItemLook LookId="SelectedTopLevelTabLook" CssClass="SelectedTopLevelTab"
                LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4" />
            <ComponentArt:ItemLook LookId="Level2TabLook" CssClass="Level2Tab" HoverCssClass="Level2TabHover"
                LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4" />
            <ComponentArt:ItemLook LookId="SelectedLevel2TabLook" CssClass="SelectedLevel2Tab"
                LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4" />
        </ItemLooks>
    </ComponentArt:TabStrip>
    <uc1:ItemConfig ID="IC" runat="server" />
</asp:Content>
