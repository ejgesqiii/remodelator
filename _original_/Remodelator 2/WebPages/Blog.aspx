<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Blog.aspx.vb" Inherits="Remodelator.Blog"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div class="DivHeader">
        Blog Page
    </div>
    <div class="StepHeader">
        About Remodelator</div>
    <div class="StepHeader">
        Baths</div>
    <div class="StepHeader">
        Kitchens</div>
    <div class="StepHeader">
        Basements</div>
    <div class="StepHeader">
        Exterior Structures</div>
    <div class="StepHeader">
        General Discussion</div>
    <div class="StepHeader">
        Contributions</div>
</asp:Content>
