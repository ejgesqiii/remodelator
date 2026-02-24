/****************Globals *******************************/
var selectedTab="";
var isIE = (window.navigator.userAgent.indexOf("MSIE") > -1);
//var serverPath="http://markert-photon/Remodelator";
var serverPath = "http://dev.remodelator.com";

/****************Common Functions *******************************/
//Add events to page's onload handler
function AddOnload(myfunc) {
    if(window.addEventListener)
        window.addEventListener('load', myfunc, false);
    else if(window.attachEvent)
        window.attachEvent('onload', myfunc);
}

//Handles check all in gridview
function SelectAllCheckboxes(spanChk) {
    var oItem = spanChk.children;
    var theBox = (spanChk.type == "checkbox") ?  spanChk : spanChk.children.item[0];
    xState = theBox.checked;
    elm = theBox.form.elements;

    for(i=0;i<elm.length;i++) {
        if(elm[i].type=="checkbox" && elm[i].id != theBox.id) {
            if(elm[i].checked!=xState) {
                elm[i].click();
            }
        }
    }
}

/****************Tree Node Handling Functions *******************************/

function TestFunc(Node, Element) {
    var SourceNodeID = Node.ID;     //TreeNode being moved
    myRE = new RegExp("!", "i");
    //Get the position of the "!", which is the delimiter for the Node ID
    var searchIndex = SourceNodeID.search(myRE);    
    //alert(searchIndex);
    var newParentID = SourceNodeID.substr(0, searchIndex);
    //alert(Element.id);
    Element.value = newParentID;    //target DOM element receiving the node
}

/****************Tab Handling Functions *******************************/

function SelectTab(elem, target, args) {
    var postback = true;
    if (selectedTab != null) {
        if (elem.id == selectedTab.id) {
            //selected tab was clicked again, so do nothing
            return;
        }
        selectedTab.className='TopLevelTab';
    }
    //elem.className='SelectedTopLevelTab';
    selectedTab=elem;
    if (args == null)
        args="";
    //window.open(serverPath + "/webpages/" + target + ".aspx" + args, '_self');
    //eval(window.open(serverPath + "/webpages/request.aspx?path=" + target + args, '_self', null, false));
}
function SetOver(elem) {
    if (elem.className == 'SelectedTopLevelTab') 
        return;
    else
        elem.className='TopLevelTabHover';
}

function SetOut(elem, evt) {
    if (elem.className == 'SelectedTopLevelTab')
        return;
    else
        elem.className='TopLevelTab';
}

/***************** Dropdown list keyboard input handling for IE6 ******************/

var _data="";

function DropdownKeyHandler(e) {
    if (document.all) {e = window.event;}
    var pressedKey = e.keyCode;
    var targetElement = isIE ? e.srcElement : e.target;
    var pressedCharacter = String.fromCharCode(pressedKey);
    if (pressedKey==32 || (pressedKey >=97 && pressedKey <=122) || (pressedKey >=65 && pressedKey <=90) || (pressedKey>=48 && pressedKey<=57)) {
        //32=space
        //97-122=a-z
        //65-90=A-Z
        //48-59=0-9
        _data += pressedCharacter;
        SetListIndex2(targetElement, _data.toLowerCase());
        return false;
    }
    else {
        _data="";
        if (pressedKey==38) {
            //up arrow
            targetElement.selectedIndex = (targetElement.selectedIndex == 0 ? 0 : targetElement.selectedIndex-1);
        }
        else if (pressedKey==40) {
            //down arrow
            targetElement.selectedIndex = (targetElement.selectedIndex == targetElement.options.length-1 ? targetElement.selectedIndex : targetElement.selectedIndex+1);
        }
        else if (pressedKey==33) {
            //page up
            if (targetElement.selectedIndex < 20) {
                targetElement.selectedIndex = 0;
            }
            else {
                targetElement.selectedIndex -= 20;
            }
        }
        else if (pressedKey==34) {
            //page down
            if (targetElement.selectedIndex > targetElement.options.length - 20) {
                targetElement.selectedIndex = targetElement.options.length-1;
            }
            else {
                targetElement.selectedIndex += 20;
            }
        }
        if (pressedKey==9 || pressedKey==13) {
            //tab & Enter keys - allow input
            return true;
        }
        else
        {
            return false;
        }
    }
    //alert(pressedKey);
    //window.status=data;
}

function ClearData() {
    _data="";
}

//Sets the selected index for a <select> element with the specified value
function SetListIndex2(elem, value)
{
    // iterate through state options list, finding the option that starts with (or matches) the specified value
    var opts = elem.options;
    for (var i=0; i<opts.length; i++) {
        if (opts[i].text.toLowerCase().indexOf(value, 0) == 0) {
            elem.selectedIndex = i;
            break;
        }
    }
}

/***************** Text formatting functions ******************/

//Formats an input string into an formatted international phone number string
//i.e. input '1234567890' will return (123) 456-7890
function FormatPhone(object) {
    var dataString = object.value;
    //remove any non-digit char (/\D/) with a ''; the g is to do a global replace otherwise only 1st instance will be replaced
    dataString = dataString.replace(/\D/g, '')     

    if (dataString.length < 5) {
        //do nothing
    }
    else if (dataString.length < 8) {
        var threeDigitPrefixEnd = dataString.length - 4;
        dataString = dataString.substring(0, threeDigitPrefixEnd) + "-" + dataString.substring(threeDigitPrefixEnd);
    }
    else if (dataString.length < 11) {
        var areaCodeEnd = dataString.length - 7;
        var threeDigitPrefixEnd = dataString.length - 4;
        dataString = "(" + dataString.substring(0, areaCodeEnd) + ") " + dataString.substring(areaCodeEnd, threeDigitPrefixEnd) + "-" + dataString.substring(threeDigitPrefixEnd);
    }
    else {
        var intCodeEnd = dataString.length - 10;
        var areaCodeEnd = dataString.length - 7;
        var threeDigitPrefixEnd = dataString.length - 4;
        dataString = dataString.substring(0, intCodeEnd) + " (" + dataString.substring(intCodeEnd, areaCodeEnd) + ")-" + dataString.substring(areaCodeEnd, threeDigitPrefixEnd) + "-" + dataString.substring(threeDigitPrefixEnd);
    }
    
    object.value = dataString;
}

//Formats an input string into an formatted zip code (US). If non-US Zip, then no formatting is applied
function FormatZipcode(object) {
    var dataString = object.value;
    //remove any non-digit char (/\D/) with a ''; the g is to do a global replace otherwise only 1st instance will be replaced
    dataString = dataString.replace(/\D/g, '');

    if (dataString.length > 9) {
        //limit entry to 9 characters maximum
        dataString = dataString.substring(0, 9);
    }
    if (dataString.length < 6) {
        //do nothing
    }
    else {
        dataString = dataString.substring(0, 5) + "-" + dataString.substring(5, dataString.length);
    }
    object.value = dataString;
}

function CountryChanged(elemId) {
   //do nothing
}

/***************** Price functions ******************/
function GetPrice(Prefix) {
    var queryParams = "";
    if ($(Prefix + 'Qty_val') == null) {
        //default to 1 if not found (like on Admin page)
        queryParams += "1:_:"
    }
    else {
        queryParams += encodeURI($F(Prefix + 'Qty_val')) + ":_:"
    }
  
    queryParams += encodeURI($F(Prefix + 'Price_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'RemUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'ElecUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'PlumUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'TinUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'DesignUnits_val')) + ":_:"
    if ($(Prefix + 'Qty_val') == null) {
        //default to 1 if not found (like on Admin page)
        queryParams += "-0:_:-0:_:-0"
    }
    else {
        queryParams += encodeURI($F(Prefix + 'MaterialMarkup_val')) + ":_:"
        queryParams += encodeURI($F(Prefix + 'LaborMarkup_val')) + ":_:"
        queryParams += encodeURI($F(Prefix + 'SubMarkup_val'))
    }
    
    var url = serverPath + "/webpages/request.aspx";
	var pars = 'Prefix=' + Prefix + '&DoPrice=1&data=' + queryParams;
    var myAjax = new Ajax.Request( url, { method: 'get', parameters: pars, onComplete: processPriceResponse, onFailure: showError });
}

function processPriceResponse(originalRequest) {
	var JSONobj = eval('('+ originalRequest.responseText +')');
	//alert(JSONobj);
	var Prefix = JSONobj.Prefix;
	var Price = JSONobj.Price;
    $(Prefix + 'ExtPrice_lbl').innerHTML = Price;
}

//Displays the results of an AJAX call to retrieve an aggregate price
function showError(originalRequest)
{
    alert(originalRequest.responseText);
}

/***************** Testing functions ******************/

function GetHTML(LineID) {
    var url = serverPath + "/webpages/request2.aspx";
    var pars = "LineID=" + LineID;
    var myAjax = new Ajax.Request( url, { method: 'post', parameters: pars, onComplete: processPriceResponse2, onFailure: showError });
}

function GetHTML2(LineID) {
    Dialog1.Show();
}

function processPriceResponse2(originalRequest) {
    //alert(originalRequest.responseText);
    data = originalRequest.responseText;
    Dialog1.Show(data, 'Edit Item');
}

function Validate(LineID) {
    //alert($F('Qty_val'));
    //TODO: Execute AJAX request to update price if all validation passes, then redirect to page
    //make a web service call?
    UpdatePrice(LineID);
}

function CloseDlg() {
    Dialog1.Close();
}

function UpdatePrice(LineID) {
    var queryParams = '';
    var Prefix = '';
    queryParams += encodeURI($F(Prefix + 'Qty_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'Price_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'RemUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'ElecUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'PlumUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'TinUnits_val')) + ":_:"
    queryParams += encodeURI($F(Prefix + 'DesignUnits_val'))
    //alert(queryParams);
    
    var url = serverPath + "/webpages/request.aspx";
	var pars = "UpdatePrice=1&LineID=" + LineID + "&data=" + queryParams;
    var myAjax = new Ajax.Request( url, { method: 'get', parameters: pars, onComplete: processPriceResponse3, onFailure: showError });
}

function processPriceResponse3(originalRequest) {
    var url = serverPath + "/webpages/Estimate.aspx";
    window.open(url, '_self');
}