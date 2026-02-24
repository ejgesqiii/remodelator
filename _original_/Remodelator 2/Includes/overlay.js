/**
 * This derivative version of subModal can be downloaded from http://gabrito.com/files/subModal/
 * Original By Seth Banks (webmaster at subimage dot com)  http://www.subimage.com/
 * Contributions by Eric Angel (tab index code), Scott (hiding/showing selects for IE users), Todd Huss (submodal class on hrefs, moving div containers into javascript, phark method for putting close.gif into CSS), Thomas Risberg (safari fixes for scroll amount), Dave Campbell (improved parsing of submodal-width-height class)
 */

// Popup code
var gPopupMask2 = null;

addEvent(window, "load", initOverlay);

function addEvent(obj, evType, fn){
    if (obj.addEventListener){
        obj.addEventListener(evType, fn, false);
        return true;
    } else if (obj.attachEvent){
        var r = obj.attachEvent("on"+evType, fn);
        return r;
    } else {
        return false;
    }
}

/**
 * Initializes overlay code on load.	
 */
function initOverlay() {
	// Add the HTML to the body
	var body = document.getElementsByTagName('body')[0];
	var popmask = document.createElement('div');
	popmask.id = 'popupMask2';
	body.appendChild(popmask);
	gPopupMask2 = document.getElementById("popupMask2");
}
var gi = 0;
function showOverlay() {
	gPopupMask2.style.display = "block";

	var fullHeight = getViewportHeight();
	var fullWidth = getViewportWidth();
	// scLeft and scTop changes by Thomas Risberg
	var scLeft,scTop;
	if (self.pageYOffset) {
		scLeft = self.pageXOffset;
		scTop = self.pageYOffset;
	} else if (document.documentElement && document.documentElement.scrollTop) {
		scLeft = document.documentElement.scrollLeft;
		scTop = document.documentElement.scrollTop;
	} else if (document.body) {
		scLeft = document.body.scrollLeft;
		scTop = document.body.scrollTop;
	} 
	gPopupMask.style.height = fullHeight + "px";
	gPopupMask.style.width = fullWidth + "px";
	gPopupMask.style.top = scTop + "px";
	gPopupMask.style.left = scLeft + "px";
	window.status = gPopupMask.style.top + " " + gPopupMask.style.left + " " + gi++;
}


/**
 * Code below taken from - http://www.evolt.org/article/document_body_doctype_switching_and_more/17/30655/ *
 * Modified 4/22/04 to work with Opera/Moz (by webmaster at subimage dot com)
 * Gets the full width/height because it's different for most browsers.
 */
function getViewportHeight() {
	if (window.innerHeight!=window.undefined) return window.innerHeight;
	if (document.compatMode=='CSS1Compat') return document.documentElement.clientHeight;
	if (document.body) return document.body.clientHeight; 
	return window.undefined; 
}

function getViewportWidth() {
	if (window.innerWidth!=window.undefined) return window.innerWidth; 
	if (document.compatMode=='CSS1Compat') return document.documentElement.clientWidth; 
	if (document.body) return document.body.clientWidth; 
	return window.undefined; 
}
