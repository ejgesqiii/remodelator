<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Register.aspx.vb" Inherits="Remodelator.Register"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/EditProfile.ascx" TagName="EditProfile" TagPrefix="uc2" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div class="DivHeader">
        New User Registration
    </div>
    <uc2:EditProfile ID="ucEditProfile" runat="server" />
</asp:Content>
