<%@ Control Language="VB" AutoEventWireup="false" CodeFile="EditProfile.ascx.vb"
    Inherits="Remodelator.EditProfile" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/VendorAddEdit.ascx" TagName="VendorAddEdit" TagPrefix="uc1" %>
<div style="padding: 5px 0px 5px 0px">
    <div id="ItemInfoDiv" runat="server">
        <div id="ItemHeadingDiv" style="width: 100%">
            <div id="ErrorPanel" runat="server" visible="false" style="background-color: Beige;
                padding: 10px 10px 10px 10px">
                The following error(s) occurred:
                <br />
                <div id="ErrorMessage" runat="server" style="color: Red; padding-left: 20px">
                </div>
            </div>
            <div id="SuccessPanel" runat="server" visible="false" style="color: green; background-color: Beige;
                padding: 10px 10px 10px 10px">
            </div>
            <div id="InfoDiv" class="AreaHeader">
                <table width="100%">
                    <tr>
                        <td>
                            <span class="AreaTitle">
                                <asp:Label ID="lblActionTitle" runat="server">Edit Profile:</asp:Label></span>
                        </td>
                        <td align="right">
                            <asp:LinkButton ID="btnViewCharges" Text="View Charges" runat="server" CssClass="LinkButtonStyle"
                                Visible="false" />
                            <asp:LinkButton ID="btnEditInfo" Text="Edit Info" runat="server" CssClass="LinkButtonStyle"
                                Visible="false" />
                        </td>
                    </tr>
                </table>
            </div>
            <div style="background-color: white; border: solid 2px #d4dfeb">
                <table>
                    <tr>
                        <td width="325px" nowrap valign="top">
                            <fieldset>
                                <legend><b>Account Information</b></legend>
                                <ClozWebControls:InputField ID="email" runat="server" Title="Email Address:" MaxLength="30"
                                    TitleWidth="115px" ValueWidth="150px" TabIndex="7" />
                                <ClozWebControls:InputField ID="username" runat="server" Title="Username:" MaxLength="30"
                                    TitleWidth="115px" ValueWidth="150px" TabIndex="8" />
                                <ClozWebControls:InputField ID="password" runat="server" Title="Password:" MaxLength="30"
                                    TitleWidth="115px" ValueWidth="150px" TabIndex="9" TextMode="Password" />
                                <ClozWebControls:InputField ID="password2" runat="server" Title="Reenter Password:"
                                    MaxLength="30" TitleWidth="115px" ValueWidth="150px" TabIndex="9" TextMode="Password" />
                                <ClozWebControls:InputField ID="hint" runat="server" Title="Password Hint:" MaxLength="30"
                                    TitleWidth="115px" ValueWidth="150px" TabIndex="10" />
                                <ClozWebControls:InputField ID="answer" runat="server" Title="Hint Answer:" MaxLength="30"
                                    TitleWidth="115px" ValueWidth="150px" TabIndex="11" />
                            </fieldset>
                        </td>
                        <td width="350px" nowrap valign="top">
                            <fieldset>
                                <legend><b>Personal Information</b></legend>
                                <ClozWebControls:InputField ID="companyName" runat="server" Title="Company Name:" MaxLength="30"
                                    TitleWidth="100px" ValueWidth="150px" TabIndex="1" />
                                <ClozWebControls:InputField ID="firstName" runat="server" Title="First Name:" MaxLength="30"
                                    TitleWidth="100px" ValueWidth="150px" TabIndex="1" />
                                <ClozWebControls:InputField ID="lastName" runat="server" Title="Last Name:" MaxLength="80"
                                    TitleWidth="100px" ValueWidth="150px" TabIndex="1" />
                                <ClozWebControls:InputField ID="address1" runat="server" Title="Address1:" MaxLength="50"
                                    TitleWidth="100px" ValueWidth="175px" TabIndex="2" />
                                <ClozWebControls:InputField ID="address2" runat="server" Title="Address2:" MaxLength="50"
                                    TitleWidth="100px" ValueWidth="175px" RequiredField="false" TabIndex="3" />
                                <ClozWebControls:InputField ID="city" runat="server" Title="City:" MaxLength="50"
                                    TitleWidth="100px" ValueWidth="175px" TabIndex="4" />
                                <ClozWebControls:InputField ID="state" runat="server" Title="State:" MaxLength="2"
                                    TitleWidth="100px" ValueWidth="75px" TabIndex="5" />
                                <ClozWebControls:InputField ID="country" runat="server" Title="Country:" MaxLength="30"
                                    TitleWidth="100px" ValueWidth="175px" AutoPostBack="False" 
                                    TabIndex="6" />
                                <ClozWebControls:InputField ID="zipcode" runat="server" Title="Zip/Postal:" MaxLength="10"
                                    TitleWidth="100px" ValueWidth="75px" FormatType="Zipcode" AutoPostBack="false"
                                    TabIndex="6" />
                            </fieldset>
                        </td>
                        <td width="250px" nowrap valign="top">
                            <fieldset>
                                <legend><b>Billing Rates</b></legend>
                                <ClozWebControls:InputField ID="RemodelerRate" runat="server" Title="Remodeler:"
                                    MaxLength="8" TitleWidth="100px" ValueWidth="75px" TabIndex="20" />
                                <ClozWebControls:InputField ID="PlumberRate" runat="server" Title="Plumber:"
                                    MaxLength="8" TitleWidth="100px" ValueWidth="75px" TabIndex="21" />
                                <ClozWebControls:InputField ID="TinnerRate" runat="server" Title="Tinner:" MaxLength="8"
                                    TitleWidth="100px" ValueWidth="75px" TabIndex="22" />
                                <ClozWebControls:InputField ID="ElectricianRate" runat="server" Title="Electrician:"
                                    MaxLength="8" TitleWidth="100px" ValueWidth="75px" TabIndex="23" />
                                <ClozWebControls:InputField ID="DesignerRate" runat="server" Title="Designer:"
                                    MaxLength="8" TitleWidth="100px" ValueWidth="75px" TabIndex="23" />
                            </fieldset>
                            <fieldset style="margin-top:10px">
                                <legend><b>Markups</b></legend>
                               <ClozWebControls:InputField ID="MaterialMarkup" runat="server" Title="Material:"
                                    MaxLength="4" TitleWidth="100px" ValueWidth="75px" TabIndex="24" />
                                <ClozWebControls:InputField ID="LaborMarkup" runat="server" Title="Labor:"
                                    MaxLength="4" TitleWidth="100px" ValueWidth="75px" TabIndex="25" />
                                <ClozWebControls:InputField ID="SubMarkup" runat="server" Title="Subcontractor:"
                                    MaxLength="4" TitleWidth="100px" ValueWidth="75px" TabIndex="25" />
                            </fieldset>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        <div id="Eula" runat="server" style="width: 100%">
            <div class="StepHeader" style="width: 100%">
                Remodelator License Agreement</div>
            <div style="height: 300px; width: 80%; overflow: auto">
                REMODELATOR SOFTWARE LICENSE TERMS These license terms are an agreement between
                Remodelator (a wholly owned subsidiary of Microsoft Corporation) and you. Please
                read them. They apply to the software you are downloading from Systinternals.com,
                which includes the media on which you received it, if any. The terms also apply
                to any Remodelator * updates, * supplements, * Internet-based services, and * support
                services for this software, unless other terms accompany those items. If so, those
                terms apply. BY USING THE SOFTWARE, YOU ACCEPT THESE TERMS. IF YOU DO NOT ACCEPT
                THEM, DO NOT USE THE SOFTWARE. If you comply with these license terms, you have
                the rights below. 1. INSTALLATION AND USE RIGHTS. You may install and use any number
                of copies of the software on your devices. 2. SCOPE OF LICENSE. The software is
                licensed, not sold. This agreement only gives you some rights to use the software.
                Remodelator reserves all other rights. Unless applicable law gives you more rights
                despite this limitation, you may use the software only as expressly permitted in
                this agreement. In doing so, you must comply with any technical limitations in the
                software that only allow you to use it in certain ways. You may not: * work around
                any technical limitations in the binary versions of the software; * reverse engineer,
                decompile or disassemble the binary versions of the software, except and only to
                the extent that applicable law expressly permits, despite this limitation; * make
                more copies of the software than specified in this agreement or allowed by applicable
                law, despite this limitation; * publish the software for others to copy; * rent,
                lease or lend the software; * transfer the software or this agreement to any third
                party; or * use the software for commercial software hosting services. 3. DOCUMENTATION.
                Any person that has valid access to your computer or internal network may copy and
                use the documentation for your internal, reference purposes. 4. EXPORT RESTRICTIONS.
                The software is subject to United States export laws and regulations. You must comply
                with all domestic and international export laws and regulations that apply to the
                software. These laws include restrictions on destinations, end users and end use.
                For additional information, see www.microsoft.com/exporting. 5. SUPPORT SERVICES.
                Because this software is “as is,” we may not provide support services for it. 6.
                ENTIRE AGREEMENT. This agreement, and the terms for supplements, updates, Internet-based
                services and support services that you use, are the entire agreement for the software
                and support services. 7. APPLICABLE LAW. a. United States. If you acquired the software
                in the United States, Washington state law governs the interpretation of this agreement
                and applies to claims for breach of it, regardless of conflict of laws principles.
                The laws of the state where you live govern all other claims, including claims under
                state consumer protection laws, unfair competition laws, and in tort. b. Outside
                the United States. If you acquired the software in any other country, the laws of
                that country apply. 8. LEGAL EFFECT. This agreement describes certain legal rights.
                You may have other rights under the laws of your country. You may also have rights
                with respect to the party from whom you acquired the software. This agreement does
                not change your rights under the laws of your country if the laws of your country
                do not permit it to do so. 9. DISCLAIMER OF WARRANTY. THE SOFTWARE IS LICENSED “AS-IS.”
                YOU BEAR THE RISK OF USING IT. Remodelator GIVES NO EXPRESS WARRANTIES, GUARANTEES
                OR CONDITIONS. YOU MAY HAVE ADDITIONAL CONSUMER RIGHTS UNDER YOUR LOCAL LAWS WHICH
                THIS AGREEMENT CANNOT CHANGE. TO THE EXTENT PERMITTED UNDER YOUR LOCAL LAWS, Remodelator
                EXCLUDES THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
                AND NON-INFRINGEMENT. 10. LIMITATION ON AND EXCLUSION OF REMEDIES AND DAMAGES. YOU
                CAN RECOVER FROM Remodelator AND ITS SUPPLIERS ONLY DIRECT DAMAGES UP TO U.S. $5.00.
                YOU CANNOT RECOVER ANY OTHER DAMAGES, INCLUDING CONSEQUENTIAL, LOST PROFITS, SPECIAL,
                INDIRECT OR INCIDENTAL DAMAGES. This limitation applies to * anything related to
                the software, services, content (including code) on third party Internet sites,
                or third party programs; and * claims for breach of contract, breach of warranty,
                guarantee or condition, strict liability, negligence, or other tort to the extent
                permitted by applicable law. It also applies even if Remodelator knew or should
                have known about the possibility of the damages. The above limitation or exclusion
                may not apply to you because your country may not allow the exclusion or limitation
                of incidental, consequential or other damages.
            </div>
            <table>
                <tr>
                    <td>
                        <div style="color: Red; padding: 10px 0px 0px 0px">
                            Do you accept the terms of the License Agreement?
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:RadioButtonList ID="btnLicense" runat="server" RepeatDirection="horizontal">
                            <asp:ListItem Text="Accept" Value="0"></asp:ListItem>
                            <asp:ListItem Text="Decline" Value="1"></asp:ListItem>
                        </asp:RadioButtonList></td>
                </tr>
            </table>
        </div>
        <div id="ButtonPanel2" runat="server" align="right">
            <table style="padding: 10px 10px 5px 0px">
                <tr>
                    <td align="right">
                        <div class="button">
                            <asp:LinkButton ID="btnSave" Text="Save" runat="server" Visible="true" Width="75px" /></div>
                    </td>
                    <td>
                        <div class="button">
                            <asp:LinkButton ID="btnCancel" Text="Cancel" runat="server" Visible="true" Width="75px"
                                CausesValidation="false" /></div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <!-- Markup and script for Vendor editing modal content -->
    <div id="ModalContent" style="display: none">
        <uc1:VendorAddEdit ID="ucVendorAddEdit" runat="server" />
    </div>
</div>
