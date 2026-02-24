<%@ Control Language="VB" AutoEventWireup="false" CodeFile="Tabs.ascx.vb" Inherits="Remodelator.Tabs" %>
<%@ Register TagPrefix="ComponentArt" Namespace="ComponentArt.Web.UI" Assembly="ComponentArt.Web.UI" %>
<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<div style="padding: 0px 0px 0px 0px" class="TopGroup2">
     <ComponentArt:Menu id="Menu1" 
     orientation="horizontal"
      DefaultGroupCssClass="TopGroup"
      DefaultItemLookId="TopLevelTabLook"
      DefaultSelectedItemLookId="SelectedTopLevelTabLook"
      DefaultChildSelectedItemLookId="SelectedTopLevelTabLook"
      DefaultGroupItemSpacing="0"
      ImagesBaseUrl="images/"
      runat="server" EnableViewState="true"
       CollapseSlide="none"
       ExpandSlide="None" >
    <ItemLooks>
      <ComponentArt:ItemLook LookId="TopLevelTabLook" CssClass="TopLevelTab" HoverCssClass="TopLevelTabHover" LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4" />
      <ComponentArt:ItemLook LookId="SelectedTopLevelTabLook" CssClass="SelectedTopLevelTab" LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4"  />
      <ComponentArt:ItemLook LookId="Level2TabLook" CssClass="Level2Tab" HoverCssClass="Level2TabHover" LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4" />
      <ComponentArt:ItemLook LookId="SelectedLevel2TabLook" CssClass="SelectedLevel2Tab" LabelPaddingLeft="15" LabelPaddingRight="15" LabelPaddingTop="4" LabelPaddingBottom="4"  />
    </ItemLooks>
    </ComponentArt:Menu>
</div>
