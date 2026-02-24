<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Suppliers.aspx.vb" Inherits="Remodelator.Suppliers" 
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div class="DivHeader">
        Suppliers Page
    </div>
    <div class="StepHeader"><a href="http://www.kohler.com/" target="_new">Kohler</a></div>
    <div class="StepHeader"><a href="http://www.americanstandard-us.com/" target="_new">American Standard</a></div>
    <div class="StepHeader"><a href="http://www.deltafaucet.com/wps/portal/deltacom/" target="_new">Delta</a></div>
    <div style="height:100px"></div>
    <div style="font-size:14px;color:Navy"><i>Do you want to be featured in Remodelator?</i></div>
</asp:Content>