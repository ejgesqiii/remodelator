<%@ Page Language="VB" AutoEventWireup="false" CodeFile="News.aspx.vb" Inherits="Remodelator.News"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div class="DivHeader">
        News Page
    </div>
    <div class="StepHeader">News Item 1</div>
    <div class="StepHeader">News Item 2</div>
    <div class="StepHeader">News Item 3</div>
</asp:Content>
