<%@ Control Language="VB" AutoEventWireup="false" CodeFile="ItemConfig.ascx.vb" Inherits="Remodelator.ItemConfig" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register Src="../UserControls/ItemAddEdit.ascx" TagName="ItemAddEdit" TagPrefix="uc1" %>

<script type="text/javascript">

    function tvItems2_NodeSelected(sender, eventArgs) { 
        var overLay = $("Overlay1");
        if (overLay != null) {
            var contentPane = $("ctl00_CP_IC_Splitter1_pane_1");
            //alert(contentPane.style.width + " " + contentPane.style.height);
            //overLay.style.top=contentPane.top;
            overLay.style.width=contentPane.style.width;
            overLay.style.height=contentPane.style.height;
            //alert(overLay.style.width + " " + overLay.style.height);
            overLay.style.zIndex=999;
            overLay.style.display="";
        }
        //need to manually call expand to expand the node when using a callback
        eventArgs.get_node().expand();
    }
    
    function resizeTree(elemId, NewPaneHeight, NewPaneWidth) {
        tvItems2.Render();
    }

    function PaneB_Resize(sender, eventArgs) { 
        //set div overlay dimensions to same size as splitter pane
        /*
        var overLay = $("Overlay1");
        if (overLay != null) {
            alert(eventArgs.get_pane().get_id());
            alert(overLay.style.width + " " + overLay.style.height);
            overLay.style.width=eventArgs.get_pane().get_width() + "px";
            overLay.style.height=eventArgs.get_pane().get_height() + "px";
            alert(overLay.style.width + " " + overLay.style.height);
        }
        */
    }
</script>

<div>
    <asp:UpdatePanel ID="UpdatePanel1" UpdateMode="Always" runat="server">
        <Triggers>
            <asp:AsyncPostBackTrigger ControlID="tvItems2" />
        </Triggers>
        <ContentTemplate>
            <table cellpadding="1" cellspacing="1" border="0">
                <tr>
                    <td valign="middle">
                        <asp:LinkButton ID="lnkNewFolder" runat="server" Text="Create New Folder"> </asp:LinkButton></td>
                    <td id="Spacer1" runat="server" style="width: 20px">
                    </td>
                    <td>
                        <asp:LinkButton ID="lnkNewItem" runat="server" Text="Create New Item"></asp:LinkButton></td>
                    <td id="Spacer2" runat="server" style="width: 20px">
                    </td>
                    <td>
                        <asp:LinkButton ID="lnkCopyItem" runat="server" Text="Add Node Reference"></asp:LinkButton></td>
                </tr>
            </table>
        </ContentTemplate>
    </asp:UpdatePanel>
</div>
<ComponentArt:Splitter ID="Splitter1" runat="server" ImagesBaseUrl="~/Images/Splitter"
    FillHeight="true" FillWidth="true">
    <Layouts>
        <ComponentArt:SplitterLayout>
            <Panes Orientation="Horizontal" SplitterBarCollapseImageUrl="splitter_horCol.gif"
                SplitterBarCollapseHoverImageUrl="splitter_horColHover.gif" SplitterBarExpandImageUrl="splitter_horExp.gif"
                SplitterBarExpandHoverImageUrl="splitter_horExpHover.gif" SplitterBarCollapseImageWidth="5"
                SplitterBarCollapseImageHeight="116" SplitterBarCssClass="HorizontalSplitterBar"
                SplitterBarCollapsedCssClass="CollapsedHorizontalSplitterBar" SplitterBarActiveCssClass="ActiveSplitterBar"
                SplitterBarWidth="5">
                <ComponentArt:SplitterPane PaneContentId="PaneA" MinWidth="225" Width="350" Height="100%"
                    CssClass="SplitterPane" ClientSideOnResize="resizeTree" />
                <ComponentArt:SplitterPane PaneContentId="PaneB" CssClass="SplitterPane">
                    <ClientEvents>
                        <PaneResize EventHandler="PaneB_Resize" />
                    </ClientEvents>
                </ComponentArt:SplitterPane>
            </Panes>
        </ComponentArt:SplitterLayout>
    </Layouts>
    <Content>
        <ComponentArt:SplitterPaneContent ID="PaneA">
            <div style="width: 100%; height: 100%; overflow: auto">
                <ComponentArt:TreeView ID="tvItems2" AutoPostBackOnSelect="true" AutoPostBackOnNodeMove="true"
                    ExpandSinglePath="false" AutoScroll="false" CssClass="TreeView" NodeCssClass="TreeNode"
                    SelectedNodeCssClass="SelectedTreeNode" HoverNodeCssClass="HoverTreeNode" NodeEditCssClass="NodeEdit"
                    LineImageWidth="19" LineImageHeight="20" DefaultImageWidth="16" BorderWidth="0"
                    DefaultImageHeight="16" ItemSpacing="0" NodeLabelPadding="3" ShowLines="true"
                    LineImagesFolderUrl="~/images/TreeView/Lines/" ImagesBaseUrl="~/images/TreeView/"
                    EnableViewState="true" runat="server">
                    <ClientEvents>
                        <NodeSelect EventHandler="tvItems2_NodeSelected" />
                    </ClientEvents>
                </ComponentArt:TreeView>
            </div>
        </ComponentArt:SplitterPaneContent>
        <ComponentArt:SplitterPaneContent ID="PaneB">
            <div style="width: 100%; height: 100%; overflow: auto">
                <asp:UpdatePanel ID="UpdatePanel2" UpdateMode="Always" runat="server">
                    <Triggers>
                        <asp:AsyncPostBackTrigger ControlID="tvItems2" />
                        <asp:PostBackTrigger ControlID="IAE" />
                    </Triggers>
                    <ContentTemplate>
                        <div id="Overlay1" style="position: absolute; width: 300px; height: 300px; display: none;"
                            class="OP1">
                            <div style="color: black; font-weight: bold; font-size: 12pt; padding: 2px 0px 0px 2px">
                                <img src="../includes/spinner.gif" />
                                Loading...</div>
                        </div>
                        <uc1:ItemAddEdit ID="IAE" runat="server" />
                    </ContentTemplate>
                </asp:UpdatePanel>
            </div>
        </ComponentArt:SplitterPaneContent>
    </Content>
</ComponentArt:Splitter>

<script type="text/javascript" language="javascript">
//We need to know when the update panel finishes loading, so we can execute custom script that enables multi-file uploads
var prm = Sys.WebForms.PageRequestManager.getInstance();
prm.add_pageLoaded(PageLoadedEventHandler);
function PageLoadedEventHandler() {
try {
    //Create an instance of the multiSelector class, pass it the output target and the max number of files
    var multi_selector = new MultiSelector( document.getElementById( 'files_list' ), 6 );
    //Pass in the file element
    multi_selector.addElement( document.getElementById( 'ImagePath' ) );
    //alert(multi_selector);
}
catch(err)
{
}
}
</script>

