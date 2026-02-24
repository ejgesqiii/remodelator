<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Eula.aspx.vb" Inherits="Remodelator.Eula"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div class="DivHeader">
        EULA Page
    </div>
    <div class="StepHeader">
        Remodelator License Agreement</div>
    <div style="height: 300px; width: 500px; overflow: auto">
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
                    Do you accept all the terms of the preceding License Agreement?
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
        <tr>
            <td align="right">
                <asp:Button ID="btnContinue" runat="server" Text="Continue" /></td>
        </tr>
    </table>
</asp:Content>
