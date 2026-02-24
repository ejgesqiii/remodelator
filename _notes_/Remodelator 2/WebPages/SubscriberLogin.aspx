<%@ Page Language="VB" AutoEventWireup="false" CodeFile="SubscriberLogin.aspx.vb"
    Inherits="Remodelator.SubscriberLogin" MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
       <div class="DivHeader">
        Subscriber Login Page
    </div>
    <table>
        <tr>
            <td>
                <ClozWebControls:InputField ID="firstName" runat="server" Title="First Name:" MaxLength="40"
                    TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                <ClozWebControls:InputField ID="lastName" runat="server" Title="Last Name:" MaxLength="40"
                    TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                <ClozWebControls:InputField ID="company" runat="server" Title="Company:" MaxLength="40"
                    TitleWidth="120px" ValueWidth="200px" TabIndex="200" />
                <ClozWebControls:InputField ID="cardType" runat="server" Title="Card Type:" TitleWidth="125px"
                    ValueWidth="100px" />
                <ClozWebControls:InputField ID="cardNo" runat="server" Title="Card #:" TitleWidth="125px"
                    ValueWidth="150px" FormatType="CreditCard" />
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width: 125px;" align="right">
                            Expiration Date:
                        </td>
                        <td>
                            <ClozWebControls:InputField ID="cardExpMonth" runat="server" Title="" MaxLength="7"
                                TitleWidth="0px" ValueWidth="45px" />
                        </td>
                        <td>
                            <ClozWebControls:InputField ID="cardExpYear" runat="server" Title="" MaxLength="4"
                                TitleWidth="0px" ValueWidth="60px" />
                        </td>
                    </tr>
                </table>
                <ClozWebControls:InputField ID="cardCvv" runat="server" Title="Card ID:" MaxLength="4"
                    TitleWidth="125px" ValueWidth="50px" RequiredField="false" FormatType="CardID" />
                <ClozWebControls:InputField ID="cardName" runat="server" Title="Name on Card:" MaxLength="30"
                    TitleWidth="125px" ValueWidth="150px" />
                <ClozWebControls:InputField ID="cardAddr" runat="server" Title="Cardholder Address:"
                    MaxLength="30" TitleWidth="125px" ValueWidth="150px" RequiredField="false" />
                <ClozWebControls:InputField ID="cardZip" runat="server" Title="Card Billing Zip:"
                    MaxLength="10" TitleWidth="125px" ValueWidth="150px" FormatType="Zipcode" />
            </td>
        </tr>
        <tr>
            <td align="right">
                <asp:Button ID="btnLogin" runat="server" Text="Log in" /></td>
        </tr>
    </table>
</asp:Content>
