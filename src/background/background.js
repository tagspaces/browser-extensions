/*chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.create({ url: 'index.html'});
});*/
/*chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        chrome.tabs.create({url: "index.html"});
    }else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion +" !");
    }
});*/
chrome.runtime.setUninstallURL("https://www.tagspaces.org/uninstallsurvey/");
