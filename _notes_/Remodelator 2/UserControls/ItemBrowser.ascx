<%@ Control Language="VB" AutoEventWireup="false" CodeFile="ItemBrowser.ascx.vb"
    Inherits="Remodelator.ItemBrowser" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<%@ Register Src="../UserControls/ItemSelect.ascx" TagName="ItemSelect" TagPrefix="uc1" %>

<script type="text/javascript">

    function tvItems_NodeSelected(sender, eventArgs) { 
        var overLay = $("Overlay1");
        if (overLay != null) {
            var contentPane = $("ctl00_CP_ucItemBrowser_Splitter1_pane_1");
            //alert(contentPane.style.width + " " + contentPane.style.height);
            //overLay.style.top=contentPane.top;
            //alert(contentPane.style.width + " " + contentPane.style.height);
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
        tvItems.Render();
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

<ComponentArt:Splitter ID="Splitter1" runat="server" ImagesBaseUrl="~/Images/Splitter"
    FillWidth="true" FillHeight="true">
    <Layouts>
        <ComponentArt:SplitterLayout>
            <Panes Orientation="Horizontal" SplitterBarCollapseImageUrl="splitter_horCol.gif"
                SplitterBarCollapseHoverImageUrl="splitter_horColHover.gif" SplitterBarExpandImageUrl="splitter_horExp.gif"
                SplitterBarExpandHoverImageUrl="splitter_horExpHover.gif" SplitterBarCollapseImageWidth="5"
                SplitterBarCollapseImageHeight="116" SplitterBarCssClass="HorizontalSplitterBar"
                SplitterBarCollapsedCssClass="CollapsedHorizontalSplitterBar" SplitterBarActiveCssClass="ActiveSplitterBar"
                SplitterBarWidth="5">
                <ComponentArt:SplitterPane PaneContentId="PaneA" MinWidth="225" Width="350" CssClass="SplitterPane"
                    ClientSideOnResize="resizeTree" />
                <ComponentArt:SplitterPane PaneContentId="PaneB" CssClass="SplitterPane" Width="100%"
                    Height="100%">
                    <ClientEvents>
                        <PaneResize EventHandler="PaneB_Resize" />
                    </ClientEvents>
                </ComponentArt:SplitterPane>
            </Panes>
        </ComponentArt:SplitterLayout>
    </Layouts>
    <Content>
        <ComponentArt:SplitterPaneContent ID="PaneA">
            <asp:Label ID="PreviousFolder" runat="server"></asp:Label>
            <asp:Label ID="NextFolder" runat="server"></asp:Label>
            <div style="width: 100%; height: 100%; overflow: auto">
                <ComponentArt:TreeView ID="tvItems" AutoPostBackOnSelect="true" AutoPostBackOnNodeMove="true"
                    ExpandSinglePath="false" AutoScroll="false" CssClass="TreeView"
                    NodeCssClass="TreeNode" SelectedNodeCssClass="SelectedTreeNode" HoverNodeCssClass="HoverTreeNode"
                    NodeEditCssClass="NodeEdit" LineImageWidth="19" LineImageHeight="20" DefaultImageWidth="16"
                    BorderWidth="0" DefaultImageHeight="16" ItemSpacing="0" NodeLabelPadding="3"
                    ShowLines="true" LineImagesFolderUrl="~/images/TreeView/Lines/" ImagesBaseUrl="~/images/TreeView/"
                    EnableViewState="true" runat="server">
                    <ClientEvents>
                        <NodeSelect EventHandler="tvItems_NodeSelected" />
                    </ClientEvents>
                </ComponentArt:TreeView>
            </div>
        </ComponentArt:SplitterPaneContent>
        <ComponentArt:SplitterPaneContent ID="PaneB">
            <div style="width: 100%; height: 100%; overflow: auto">
                <asp:UpdatePanel ID="UpdatePanel2" UpdateMode="Always" runat="server">
                    <Triggers>
                        <asp:AsyncPostBackTrigger ControlID="tvItems" />
                        <asp:PostBackTrigger ControlID="ucItemSelect" />
                    </Triggers>
                    <ContentTemplate>
                        <div id="Overlay1" style="position: absolute; width: 300px; height: 300px; display: none;"
                            class="OP1">
                            <div style="color: black; font-weight: bold; font-size: 12pt;">
                                <img src="../includes/spinner.gif" />
                                Loading...</div>
                        </div>
                        <uc1:ItemSelect ID="ucItemSelect" runat="server" />
                    </ContentTemplate>
                </asp:UpdatePanel>
            </div>
        </ComponentArt:SplitterPaneContent>
    </Content>
</ComponentArt:Splitter>
