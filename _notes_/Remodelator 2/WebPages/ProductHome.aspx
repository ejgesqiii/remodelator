<%@ Page Language="VB" AutoEventWireup="false" CodeFile="ProductHome.aspx.vb" Inherits="Remodelator.ProductHome"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<%@ Register Src="../UserControls/EditProfile.ascx" TagName="EditProfile" TagPrefix="uc2" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
<style type="text/css">
.Block {
border: solid 1px black; 
width: 100px; 
height: 100px; 
text-align: center;
text-decoration:none;
}

</style>
    <center>
        <table width="200px" cellpadding="20" cellspacing="0">
            <tr>
                <td>
                    <div id="Link1" runat="server"></div>
                </td>
                <td>
                    <div id="Link2" runat="server"></div>
                </td>
            </tr>
            <tr>
                <td>
                    <div id="Link3" runat="server"></div>
                </td>
                <td>
                    <div id="Link4" runat="server"></div>
                </td>
            </tr>
            <tr>
                <td>
                    <div id="Link5" runat="server"></div>
                </td>
                <td>
                    <div id="Link6" runat="server"></div>
                </td>
            </tr>
        </table>
    </center>
</asp:Content>
