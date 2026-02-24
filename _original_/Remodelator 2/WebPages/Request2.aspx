<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Request2.aspx.vb" Inherits="Remodelator.Request2" %>

<%@ Register TagPrefix="ClozWebControls" Namespace="ClozWebControls" Assembly="ClozWebControls" %>
<html>
<body>
    <form id="Form1" runat="server">
        <div id="ErrorPanel" runat="server" visible="false" style="background-color: Beige;
            padding: 10px 10px 10px 10px">
            The following error(s) occurred:
            <br />
            <div id="ErrorMessage" runat="server" style="color: Red; padding-left: 20px">
            </div>
        </div>
        <div id="EditPanel" runat="server">
            <ClozWebControls:InputField ID="Name" runat="server" Title="Item:" MaxLength="40"
                TitleWidth="80px" ValueWidth="300px" TabIndex="200" />
            <table border="0">
                <tr>
                    <td>
                        <ClozWebControls:InputField ID="Qty" runat="server" Title="Quantity:" MaxLength="40"
                            TitleWidth="80px" ValueWidth="50px" TabIndex="200" />
                    </td>
                    <td>
                        <ClozWebControls:InputField ID="ExtPrice" runat="server" Title="Material:" MaxLength="40"
                            TitleWidth="70px" ValueWidth="75px" TabIndex="200" />
                    </td>
                    <td>
                    </td>
                </tr>
                <tr>
                    <td>
                        <ClozWebControls:InputField ID="RemUnits" runat="server" Title="Remodeler:" MaxLength="40"
                            TitleWidth="80px" ValueWidth="50px" TabIndex="200" />
                    </td>
                    <td>
                        <ClozWebControls:InputField ID="ElecUnits" runat="server" Title="Electrical:" MaxLength="40"
                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                    </td>
                    <td>
                        <ClozWebControls:InputField ID="PlumUnits" runat="server" Title="Plumber:" MaxLength="40"
                            TitleWidth="60px" ValueWidth="50px" TabIndex="200" />
                    </td>
                </tr>
                <tr>
                    <td align="left">
                        <ClozWebControls:InputField ID="TinUnits" runat="server" Title="Tinner:" MaxLength="40"
                            TitleWidth="80px" ValueWidth="50px" TabIndex="200" />
                    </td>
                    <td align="left">
                        <ClozWebControls:InputField ID="DesignUnits" runat="server" Title="Designer:" MaxLength="40"
                            TitleWidth="70px" ValueWidth="50px" TabIndex="200" />
                    </td>
                    <td>
                    </td>
                </tr>
            </table>
            <ClozWebControls:InputField ID="Comment" runat="server" Title="Comment:" MaxLength="40"
                TitleWidth="80px" ValueWidth="250px" TabIndex="200" MultiLine="true" />
            <asp:HiddenField ID="Price_val" runat="server" />
            <center>
                <input type='button' onclick="Validate('<%=LineID %>');" value='Save' />
                <input type='button' onclick='CloseDlg();' value='Cancel' />
            </center>
        </div>
    </form>
</body>
</html>
