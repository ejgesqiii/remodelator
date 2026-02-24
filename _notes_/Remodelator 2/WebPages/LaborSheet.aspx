<%@ Page Language="VB" AutoEventWireup="false" CodeFile="LaborSheet.aspx.vb" Inherits="Remodelator.LaborSheet" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/tr/html4/loose.dtd">
<html>
<head>
    <title>Labor Sheet</title>
    <link href="../includes/site.css" rel="stylesheet" type="text/css" />
    <link href="~/Styles/print.css" type="text/css" rel="stylesheet" media="print" />
</head>
<body>
    <form id="Form1" runat="Server">
        <div style="padding: 10px 10px 10px 10px">
            <asp:GridView ID="LaborGrid" runat="server" AutoGenerateColumns="False" AllowSorting="False"
                DataKeyNames="LineID" Style="border: solid 2px #d4dfeb;" Width="650px">
                <Columns>
                    <asp:BoundField DataField="LineID" Visible="False" ReadOnly="true" />
                    <asp:BoundField DataField="Name" HeaderText="Item" ReadOnly="true" HeaderStyle-HorizontalAlign="center"
                        ItemStyle-HorizontalAlign="left" />
                    <asp:BoundField DataField="RemodelerLaborUnits" HeaderText="Remodeler" ReadOnly="true"
                        ItemStyle-HorizontalAlign="right" />
                    <asp:BoundField DataField="ElectricianLaborUnits" HeaderText="Electrician" ReadOnly="true"
                        ItemStyle-HorizontalAlign="right" />
                    <asp:BoundField DataField="PlumberLaborUnits" HeaderText="Plumber" ReadOnly="true"
                        ItemStyle-HorizontalAlign="right" />
                    <asp:BoundField DataField="TinnerLaborUnits" HeaderText="Tinner" ReadOnly="true"
                        ItemStyle-HorizontalAlign="right" />
                    <asp:BoundField DataField="DesignerLaborUnits" HeaderText="Designer" ReadOnly="true"
                        ItemStyle-HorizontalAlign="right" />
                </Columns>
                <EmptyDataTemplate>
                    No items have been added to this estimate.
                </EmptyDataTemplate>
                <RowStyle HorizontalAlign="Center" />
                <HeaderStyle HorizontalAlign="right" />
                <SelectedRowStyle BackColor="#98AFC7" />
                <EmptyDataRowStyle CssClass="EmptyGridRow" />
            </asp:GridView>
        </div>
    </form>
</body>
</html>
