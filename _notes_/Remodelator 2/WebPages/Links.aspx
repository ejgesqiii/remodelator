<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Links.aspx.vb" Inherits="Remodelator.Links"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div class="DivHeader">
        Sponsor Links Page
    </div>
    <div class="StepHeader">Sponsor Link 1</div>
    <div class="StepHeader">Sponsor Link 2</div>
    <div class="StepHeader">Sponsor Link 3</div>
</asp:Content>
