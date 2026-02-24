<%@ Page Language="VB" AutoEventWireup="false" CodeFile="ItemView.aspx.vb" Inherits="Remodelator.ItemView" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/tr/html4/loose.dtd">
<%@ Register Src="../UserControls/ItemDetail.ascx" TagName="ItemDetail" TagPrefix="uc1" %>
<html>
<head>
<title>Item Accessory Details</title>
    <link href="../includes/site.css" rel="stylesheet" type="text/css" />
    <link href="../styles/basestyle.css" rel="stylesheet" type="text/css" />
</head>
<body >
    <form id="Form1" runat="Server">
        <uc1:ItemDetail ID="ucItemDetail" runat="server" />
    </form>
</body>
</html>
