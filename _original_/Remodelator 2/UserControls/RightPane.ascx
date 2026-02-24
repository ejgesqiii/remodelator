<%@ Control Language="VB" AutoEventWireup="false" CodeFile="RightPane.ascx.vb" Inherits="Remodelator.RightPane" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<style type="text/css">
.Link
{
  padding-top:10px; 
}</style>
<div style="padding: 0px 0px 0px 0px;text-align:left;width:200px;">
    <div style="border: 1px solid black;">
        <asp:Login ID="Login1" runat="server" BackColor="#F7F6F3" BorderColor="#E6E2D8" BorderPadding="4"
            BorderStyle="Solid" BorderWidth="1px" Font-Size="8pt" Font-Names="Verdana" ForeColor="#333333"
            DisplayRememberMe="false" FailureText="The information you entered does not match our records. Please try again."
            FailureTextStyle-Font-Italic="true" FailureTextStyle-Height="30px" UserNameLabelText="Username:"
            LoginButtonType="button" Width="200px">
            <TitleTextStyle BackColor="#5D7B9D" Font-Bold="True" ForeColor="White" />
            <LoginButtonStyle BackColor="#194779" BorderStyle="Solid" BorderWidth="1px" ForeColor="white" />
            <InstructionTextStyle Font-Italic="True" ForeColor="Black" />
            <LayoutTemplate>
                <table border="0">
                    <tr>
                        <td align="center" colspan="2" style="color: White; background-color: #5D7B9D; font-weight: bold;">
                            Please Log In</td>
                    </tr>
                    <tr>
                        <td>
                            <asp:Label ID="UserNameLabel" runat="server" AssociatedControlID="UserName">User Name:</asp:Label></td>
                    </tr>
                    <tr>
                        <td>
                            <asp:TextBox ID="UserName" runat="server" TabIndex="1" Width="175px"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="UserNameRequired" runat="server" ControlToValidate="UserName"
                                ErrorMessage="*" ValidationGroup="Login1">*</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <asp:Label ID="PasswordLabel" runat="server" AssociatedControlID="Password">Password:</asp:Label></td>
                    </tr>
                    <tr>
                        <td>
                            <asp:TextBox ID="Password" runat="server" TextMode="Password" TabIndex="2" Width="175px"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="PasswordRequired" runat="server" ControlToValidate="Password"
                                ErrorMessage="*" ValidationGroup="Login1">*</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr><td><a href="ForgotPassword.aspx">Forgot Your Password?</a></td></tr>
                    <tr style="display:none"><td>New to Remodelator?&nbsp;<a href="Register.aspx">Register</a></td></tr>
                    <tr>
                        <td align="center">
                            <asp:Label ID="FailureText" runat="server" ForeColor="red"></asp:Label></td>
                    </tr>
                    <tr>
                        <td align="right">
                            <asp:Button ID="LoginButton" runat="server" CommandName="Login" Text="Log In" ValidationGroup="Login1"
                                TabIndex="4" /></td>
                    </tr>
                </table>
            </LayoutTemplate>
        </asp:Login>
        <asp:Label ID="lblTimeoutMessage" runat="server" ForeColor="red"></asp:Label>
    </div>
    <div style="border: solid 1px black; padding: 10px 10px 10px 10px; margin: 10px 0px 0px 0px">
        <div class="Link">
            <a href="../WebPages/Blog.aspx" target="_self">Blog Land</a></div>
        <div class="Link">
            <a href="../WebPages/News.aspx" target="_self">News</a></div>
    </div>
    <div style="border: solid 1px black; padding: 10px 10px 10px 10px; margin: 10px 0px 0px 0px">
        <div class="Link">
            <a href="../WebPages/Suppliers.aspx" target="_self">Suppliers</a></div>
        <div class="Link">
            <a href="../WebPages/Links.aspx" target="_self">Links</a></div>
    </div>
    <div style="border: solid 1px black; padding: 10px 10px 10px 10px; margin: 10px 0px 0px 0px">
        <div class="Link">
            <a href="../WebPages/About.aspx" target="_self">About Remodelator</a></div>
        <div>
        </div>
    </div>
</div>
