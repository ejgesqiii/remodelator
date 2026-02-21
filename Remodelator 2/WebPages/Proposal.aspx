<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Proposal.aspx.vb" Inherits="Remodelator.Proposal"
    MasterPageFile="~/MasterPages/site.master" %>

<%@ MasterType TypeName="Remodelator.site" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>
<asp:Content ID="NavContent" ContentPlaceHolderID="CP" runat="server">
    <div id="header">
        <div id="JobBanner" runat="server" class="JobHeader">
        </div>
    </div>
    <div id="content" style="width: 650px; padding-left: 5px">
        <div style="font-size: 14pt; font-weight: bold; text-align: center">
            <asp:Label ID="SubscriberAddress" runat="server"></asp:Label>
        </div>
        <div style="font-size: 12pt; text-align: left">
            <u>Client Proposal For:</u><br />
            <div style="padding-top: 5px; font-size: 10pt">
                <asp:Label ID="ClientAddress" runat="server"></asp:Label>
            </div>
        </div>
        <div style="padding-top: 20px">
            <table>
                <tr>
                    <td align="left" style="font-size: 10pt">
                        Proposal Name:
                        <asp:Label ID="ProposalName" runat="server" Font-Bold="true"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:GridView ID="EstimateGrid" runat="server" AutoGenerateColumns="False" AllowSorting="False"
                            DataKeyNames="LineID" Style="border: solid 2px #d4dfeb;" Width="650px">
                            <Columns>
                                <asp:BoundField DataField="LineID" Visible="False" ReadOnly="true" />
                                <asp:BoundField DataField="Name" HeaderText="Item" ReadOnly="true" ItemStyle-HorizontalAlign="left" />
                                <asp:BoundField DataField="Comments" HeaderText="Comment" ReadOnly="true" ItemStyle-HorizontalAlign="left" />
                                <asp:BoundField DataField="Qty" HeaderText="Qty" ReadOnly="true" />
                                <asp:BoundField DataField="NetPrice" HeaderText="Price" ReadOnly="true" DataFormatString="{0:c}"
                                    HtmlEncode="false" HeaderStyle-HorizontalAlign="right" ItemStyle-HorizontalAlign="right"
                                    ItemStyle-Width="80px" />
                                <asp:BoundField DataField="ExtPrice" HeaderText="Ext Price" ReadOnly="true" DataFormatString="{0:c}"
                                    HtmlEncode="false" HeaderStyle-HorizontalAlign="right" ItemStyle-HorizontalAlign="right"
                                    ItemStyle-Width="80px" />
                            </Columns>
                            <EmptyDataTemplate>
                                No items have been added to this estimate.
                            </EmptyDataTemplate>
                            <RowStyle HorizontalAlign="Center" />
                            <SelectedRowStyle BackColor="#98AFC7" />
                            <EmptyDataRowStyle CssClass="EmptyGridRow" />
                        </asp:GridView>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div style="border: solid 1px black; width: 620px; margin: 10px 0px 0px 5px;
        padding: 10px 15px 10px 15px">
                                    <div style="text-align:center">
                                    Kain Construction LLC<br />
                                    General Conditions and <br />
                                         Disclaimers<br />
</div>

<div style="text-align:justify">
<div class="para">The following items are included to describe general conditions and disclaimers
for typical construction projects.</div>

<div class="para">1. This proposal includes all items listed in this proposal, but does not include
any items unforeseen or not visible during site inspection (items behind walls, 
under floors, below grade or otherwise not know at time of inspection).</div>

<div class="para">2. This proposal includes items listed. The prices include labor and materials 
and are based on site visit. Prices may change for the following reasons:</div>
<div class="para2">a.	Owner changes in scope or selections.</div>
<div class="para2">b.	Inspection and permitting process (Historical Society approvals are not
        included) and scope created by building inspectors.</div>
<div class="para2">c.	Unforeseen conditions, not found at the time of proposal inspection.</div> 
<div class="para2">d.	Raw materials price escalations if past 30 days of proposal.</div> 
   

<div class="para">3. Any agreed upon additional work will proceed with the signed consent of the 
owner with a known amount in the form of a change order with 50% of the change 
order as a deposit, with the balance upon completion. Or, approval based on time
and materials may be required if the work involves unknown scope. </div> 

<div class="para">4. If changes in the contract involves money or scope disputes, the work will stop until the 
dispute is resolved.</div> 

<div class="para">5. Remodeling projects are dusty by nature. Kain Construction LLC will take all necessary 
precautions to control dust, but is not responsible for migrating dust as part of the work. 
The owner should cover furniture, computers and other valuable items to avoid dust.</div> 

<div class="para">6. Kain Construction LLC will work with subcontractors recommended by the owner, or self 
performed work. We cannot however, commit to schedules or quality of the subcontractors. 
Self-performed work requires the owner pull permits and get liability insurance to cover the 
project.</div> 

<div class="para">7. Items shown on proposal with “allow” are allowances. These numbers are subject to change 
based on choices, field conditions, and market pricing.</div> 

<div class="para">8. We have liability insurance to cover items over which we have “care, custody and control” 
of. We cannot allow children or pets in the work area, as we cannot predict what they will do.
This also applies to people not directly involved in the construction process, or non-owners.</div> 

<div class="para">9. When the construction projects starts, all items such as jewelry or other valuable items 
that the owner perceives could be at risk, should be stored in a locked area, and not 
available to construction personnel. Kain Construction will not accept responsibility for 
stolen items that cannot be proven and prosecuted. We have dishonesty bonding insurance for 
this situation, but will not reimburse owners for alleged theft, unless proven and prosecuted.</div> 

<div class="para">10. Kain Construction will not assume responsibility for, or insure people not under contract
with the homeowner.</div> 

<div class="para">11. These measures are for the protection of the homeowner, and Kain Construction.</div> 

<div class="para">Understanding the general conditions and disclaimers mentioned above, I agree to have Kain 
Construction LLC furnish and install the items in this proposal with a one year warranty 
against materials and workmanship. Normal wear and tear will be repaired at time and 
materials billing.</div> 
</div>
    </div>
    <div style="padding: 10px 0px 10px 0px">
        <table>
            <tr>
                <td>
                    Terms:</td>
                <td>
                    <div style="border-bottom: solid 1px black;width:300px">
                    </div>
                </td>
            </tr>
        </table>
    </div>
    <div style="padding: 10px 0px 20px 0px">
        <b>This proposal submitted by:</b>
        <asp:Label ID="SubscriberCompany" runat="server"></asp:Label>
        <table style="margin: 30px 0px 30px 0px">
            <tr>
                <td>
                    <div style="border-bottom: solid 1px black; width: 300px">
                    </div>
                </td>
                <td colspan="2" width="100px">
                    &nbsp;</td>
                <td>
                    <div style="border-bottom: solid 1px black; width: 200px">
                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    <asp:Label ID="SubscriberName" runat="Server"></asp:Label></td>
                <td colspan="2" width="100px">
                    &nbsp;</td>
                <td>
                    Date</td>
            </tr>
        </table>
    </div>
    <div style="padding: 0px 0px 30px 0px">
        <b>This proposal accepted by:</b>
        <table style="margin: 30px 0px 0px 0px">
            <tr>
                <td>
                    <div style="border-bottom: solid 1px black; width: 300px">
                    </div>
                </td>
                <td colspan="2" width="100px">
                    &nbsp;</td>
                <td>
                    <div style="border-bottom: solid 1px black; width: 200px">
                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    Name</td>
                <td colspan="2" width="100px">
                    &nbsp;</td>
                <td>
                    Date</td>
            </tr>
        </table>
        <table style="margin: 30px 0px 0px 0px">
            <tr>
                <td>
                    <div style="border-bottom: solid 1px black; width: 300px">
                    </div>
                </td>
                <td colspan="2" width="100px">
                    &nbsp;</td>
                <td>
                    <div style="border-bottom: solid 1px black; width: 200px">
                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    Name</td>
                <td colspan="2" width="100px">
                    &nbsp;</td>
                <td>
                    Date:</td>
            </tr>
        </table>
    </div>
    <div id="footer">
        <hr style="margin-top: 20px" />
        <table>
            <tr>
                <td>
                    <asp:Button ID="btnSendPO" runat="Server" Text="Send PO" />
                </td>
                <td>
                    <asp:Button ID="btnViewLaborSheet" runat="Server" Text="View Labor Sheet" />
                </td>
                <td>
                    <asp:Button ID="btnSaveTemplate" runat="Server" Text="Save As Template" />
                </td>
                <td>
                    <asp:Button ID="btnPrint" runat="Server" Text="Print" OnClientClick="javascript:window.print();" />
                </td>
            </tr>
        </table>
    </div>
</asp:Content>
