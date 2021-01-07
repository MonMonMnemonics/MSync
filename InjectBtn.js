//--------------------------------------------   ARCHIVE CONTROL   ------------------------------------------------
function LatchToVideo() {
	VidSeek = document.getElementsByTagName('video');
    for (let i = 0; i < VidSeek.length; i++){
        if (VidSeek[i].className == "video-stream html5-main-video"){
			MainVid = VidSeek[i];
			SendSeek(MainVid.currentTime);
			if (!MainVid.paused){
				SendPlay();
			}

            MainVid.onseeked = function() {
                SendSeek(MainVid.currentTime); //   It's in seconds.miliseconds format
			};
			MainVid.onpause = function() {
				SendPause();
			};
			MainVid.onplay = function() {
				SendPlay();
			};

            break;
        }
    }
}

function SendSeek(timestring){
    var data = {                           
		"Act": 'MChad-TimeSet',
		"UID": UID,
		"Time": timestring           
	};
	ws.send(JSON.stringify(data));
}

function SendPlay(){
    var data = {                           
		"Act": 'MChad-Play',
		"UID": UID
	};
	ws.send(JSON.stringify(data));
}

function SendPause(){
    var data = {                           
		"Act": 'MChad-Pause',
		"UID": UID
	};
	ws.send(JSON.stringify(data));
}

function SetTime(timeseek) {
    if (timeseek.valueAsNumber != NaN){
        if (timeseek > 0){
			if (MainVid.duration > timeseek){
				MainVid.currentTime = timeseek;
			} else {
				if (!MainVid.ended){
					MainVid.currentTime = MainVid.duration;
				}
			}
		}
    }
}
//=============================================================================================================



//---------------------------------------   BOUNCING TRANSLATION   -------------------------------------------
//   BOUNCING INCOMING MESSAGE TO THE LIVE CHAT SUBMITTER 

function SendTextEnter(inputtext){
	ChatText.textContent = inputtext;
	ChatText.dispatchEvent(new InputEvent("input"));
	sendBtn.click();
}

function LatchChatBox(){
	var iframeChat = document.getElementsByTagName("iframe");
    for (let i = 0; i < iframeChat.length; i++){
        if (iframeChat[i].id == "chatframe"){
			if (iframeChat[i].offsetHeight == 0){
				ws.close();
				spn.textContent = "Chatbox needs to be open";
			} else {
				ChatInputPanel = iframeChat[i].contentDocument.querySelector("#panel-pages.yt-live-chat-renderer",);
				if (ChatInputPanel.offsetHeight == 1){
					ws.close();
					spn.textContent = "The stream is not LIVE"
				} else {
					sendBtn = iframeChat[i].contentDocument.querySelector("#send-button button",); 
					ChatText = iframeChat[i].contentDocument.querySelector("#input.yt-live-chat-text-input-field-renderer",);
					ChatBoxObserver.observe(iframeChat[i].parentNode, config2);
				}
			}
			
			break;
        } else if (i == iframeChat.length - 1) {
			ws.close();
			spn.textContent = "Can't find Live Chat Input";
		}
	}
}
//=============================================================================================================



//-------------------------------------   LISTEN TO LIVE CHAT BOX   -----------------------------------------
//   READING LIVE CHAT BOX NODE CHANGE
const callback = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
			mutation.addedNodes.forEach(element => {
				data = {                            
					"Act": 'MChad-Entry',
					"UID": UID,
					"Tag": element.innerText.split("\n")[0],
					"Stime": '',
					"Stext": '',
					"CC": '',
					"OC": ''
				};

				data.Stime = TimespanStringify(MainVid.currentTime);
				data.Stext = "[" + element.innerText.split("\n")[0] + "] " + element.innerText.split("\n")[1];
				
				if ((element.getAttribute("author-type") == "mod") || (element.getAttribute("author-type").toLowerCase() == "owner")) {
					data.Tag += "," + element.getAttribute("author-type");
					ws.send(JSON.stringify(data));
				} else if ((TagList.length == 0) && (KeyWordList.length == 0)){
					ws.send(JSON.stringify(data));
				} else if ((FilterMessageTag(element.innerText.split("\n")[0])) || FilterMessageKeyword(element.innerText.split("\n")[1])) {
					ws.send(JSON.stringify(data));
				}

				//console.log(JSON.stringify(data))
				// SEND THEM TO APP OR FILTER FIRST BEFORE SENDING
			});
        }
    }
}

const ChatboxCheck = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
		if (mutation.type === 'attributes') {
			if(mutation.attributeName == "collapsed")	{
				ws.close();
				spn.textContent = "Chat Box Closed";
			};
        }
    }
}

const config = { childList: true, subtree: false };
const config2 = { attributes: true, childList: false, subtree: false };
const ChatItemObserver = new MutationObserver(callback);
const ChatBoxObserver = new MutationObserver(ChatboxCheck);

function ChatListener(){
	var iframeChat = document.getElementsByTagName("iframe");
	if (iframeChat.length == 0) {
		ws.close();
		mode = 0;
		spn.textContent = "Can't find Chat Box";
	} else {
		for (let i = 0; i < iframeChat.length; i++){
			if (iframeChat[i].id == "chatframe"){
				if (iframeChat[i].getAttribute("src").indexOf("about:blank") != -1){
					ws.close();
					spn.textContent = "Chatbox needs to be open";
				} else {
					var target = iframeChat[i].contentDocument.getElementsByClassName("style-scope yt-live-chat-item-list-renderer");
					for (let j = 0; j < target.length; j++){
						if (target[j].id == "items"){
								ListenerTarget = target[j];
								ChatItemObserver.observe(ListenerTarget, config);
								ChatBoxObserver.observe(iframeChat[i].parentNode, config2);
							break;
						} else if (j == target.length - 1){
							ws.close();
							spn.textContent = "Can't find Chat Box";
						}
					}
				}
				break;
			} else if (i == iframeChat.length - 1){
				ws.close();
				spn.textContent = "Can't find Chat Box";
			}
		}
	}

	VidSeek = document.getElementsByTagName('video');
    for (let i = 0; i < VidSeek.length; i++){
        if (VidSeek[i].className == "video-stream html5-main-video"){
			MainVid = VidSeek[i];
            break;
        }
    }
}

function TimespanStringify(timechange){
	var mn, hr;
	timechange = timechange.toString().split(".")[0];
	mn = Math.floor(timechange/60);
	timechange -= mn*60;
	hr = Math.floor(mn/60);
	mn -= hr * 60;
	
	if (timechange.toString().length == 1) timechange = "0" + timechange.toString();
	if (mn.toString().length == 1) mn = "0" + mn.toString();
	if (hr.toString().length == 1) hr = "0" + hr.toString();
	return (hr + ":" + mn + ":" + timechange);
}
//=============================================================================================================



//-------------------------------------------- FILTER UTIL  ---------------------------------------------------
var TagList = "";
var KeyWordList = "";

function FilterMessageTag(author){
	if (TagList.includes(author)) {
		return (true);
	} else {
		return (false);
	}
}

function FilterMessageKeyword(text){
	if (KeyWordList.length != 0){
		var Res = text.match(new RegExp(KeyWordList, "i"));
		if (Res.length != 0){
			return (true);
		} else {
			return (false);
		}
	} else {
		return (false);
	}
}

//=============================================================================================================



//--------------------------------------------- BASIC UTIL ----------------------------------------------------
function SendReg(){
	var title = document.getElementsByClassName("title style-scope ytd-video-primary-info-renderer");
	UID = "Youtube " + document.location.toString().substring(document.location.toString().indexOf("watch?v=") + 8);

    var data = {                           
		"Act": 'MChad-Reg',
		"UID": UID,
		"Nick": title[0].textContent.replaceAll("】", "]").replaceAll("【", "[").replaceAll("～", "-")
	};	
	ws.send(JSON.stringify(data));
}

function SendRollCall(){
    var data = {                           
		"Act": 'MChad-RollCall',
		"UID": UID,
		"Nick": title[0].textContent.replaceAll("】", "]").replaceAll("【", "[").replaceAll("～", "-")
	};	
	ws.send(JSON.stringify(data));
}

function SendUnsync(){
	var data = {                           
		"Act": 'MChad-Unsync',
		"UID": UID
	};
	ws.send(JSON.stringify(data));
}

function OpenSync() {
	if (document.location.toString().indexOf("www.youtube.com/watch?v=") != -1){
		ws = new WebSocket("ws://localhost:20083/"); //	This one is fixed, host 2008 for Mio's birthday 20 Aug and 3 for "Mi" in Mio
		//ws.onerror = function (err) {
		//}

		ws.onopen = function (event) {
			SendReg();
		};
        
        ws.onclose = function (event) {
			switch (mode){
				case 1:
					spn.textContent = "Can't reach server";
					break;
				case 3:
					MainVid.onseeked = null;
					MainVid.onpause = null;
					MainVid.onplay = null;
					spn.textContent = "Disconnected";
					break;
				case 4:
					sendBtn = null;
					ChatText = null;
					ChatInputPanel = null;
					ChatBoxObserver.disconnect();
					break;
				case 5:
					ChatItemObserver.disconnect();
					ChatBoxObserver.disconnect();
					break;
			}
			btn.textContent = "Sync MChat";
			mode = 0;
        };
		
		ws.onmessage = function (event) {
			MsgNexus(event.data.toString());
		};
	
	} else {
		alert('NOT IN YOUTUBE WATCH');
	}
}

function MsgNexus(StringData) {
	var NexusParse = StringData.toString().match(/\"Act\":\"MChad-RegOK\"|\"Act\":\"MChad-RollCallApp\"|\"Act\":\"MChad-SetMode\"|\"Act\":\"MChad-PlayApp\"|\"Act\":\"MChad-PauseApp\"|\"Act\":\"MChad-TimeSetApp\"|\"Act\":\"MChad-LiveSend\"|\"Act\":\"MChad-RegListener\"|\"Act\":\"MChad-FilterApp\"/);
	
	if (NexusParse.length != 0){
		switch(NexusParse[0]){
			case ("\"Act\":\"MChad-RegOK\""):
				mode = 2;
				btn.textContent = "Synced - Idle";
				break;
			case ("\"Act\":\"MChad-RollCallApp\""):
				SendRollCall();
				break;
			case ("\"Act\":\"MChad-SetMode\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}
		
				if (ParsedData[1].split("\":\"")[1].replace("\"","") == UID){
					switch (ParsedData[2].split("\":\"")[1].replace("\"}","")){
						case ("Archive"):
							if (mode < 3){
								mode = 3;
								btn.textContent = "Synced - Archive (Click to Unsync)";
								LatchToVideo();
							}
							break;
						case ("LiveChat"):
							if (mode < 3){
								mode = 4;
								btn.textContent = "Synced - LiveChat (Click to Unsync)";
								LatchChatBox();
							}
							break;
					}
				}
				break;
			case ("\"Act\":\"MChad-PlayApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 2){
					return;
				}
				if ((ParsedData[1].split("\":\"")[1].replace("\"}","") == UID) && (mode == 3)){
					MainVid.play();
				}
				break;
			case ("\"Act\":\"MChad-PauseApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 2){
					return;
				}
		
				if ((ParsedData[1].split("\":\"")[1].replace("\"}","") == UID) && (mode == 3)){
					MainVid.pause();
				}				
				break;
			case ("\"Act\":\"MChad-TimeSetApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}
		
				if ((ParsedData[1].split("\":\"")[1].replace("\"","") == UID) && (mode == 3)){
					SetTime(ParsedData[2].split("\":\"")[1].replace("\"}",""));
				}
				break;
			case ("\"Act\":\"MChad-LiveSend\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}

				if ((ParsedData[1].split("\":\"")[1].replace("\"","") == UID) && (mode == 4)){
					SendTextEnter(ParsedData[2].split("\":\"")[1].replace("\"}",""));
				}
				break;
			case ("\"Act\":\"MChad-RegListener\""):
				if (mode < 3){
					mode = 5;
					btn.textContent = "Synced - Listener (Click to Unsync)";
					ChatListener();
				}
				break;
			case ("\"Act\":\"MChad-FilterApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}
				
				switch (ParsedData[1].split("\":\"")[1].replace("\"","")){
					case ("TAG"):
						TagList = ParsedData[2].split("\":\"")[1].replace("\"}","").replaceAll(",", " ");
						break;
					case ("KEYWORD"):
						KeyWordList = ParsedData[2].split("\":\"")[1].replace("\"}","");
						break;						
				}
				spn.textContent = "Synced Filter"
				break;
		}
	}
}

function BtnNexus() {
	spn.textContent = "";
	if (mode == 0) {
		btn.textContent = "Syncing..."
		mode = 1;
		OpenSync();
	} else {
		ws.close();
	}
}
//=============================================================================================================



var ws;
var btn = document.createElement('button');
btn.onclick = BtnNexus;
btn.textContent = "Sync MChat"
btn.style.margin = "5px"
btn.style.background = 'black';
btn.style.color = 'white';
btn.style.fontSize = '15px';
btn.style.cursor = 'pointer';
btn.style.textAlign = 'center';
btn.style.borderRadius = '15px';
btn.style.padding = '8px';

var spn = document.createElement('span');
spn.textContent = "";
spn.style.fontSize = '15px';
spn.style.background = 'white';

var MainVid = document.createElement('video');
var sendBtn; 
var ChatText;
var ListenerTarget;
var ChatInputPanel;

var UID = "";
var mode = 0;
/*
	0 : NOT SYNCED
	1 : SYNCING
	2 : SYNCED-IDLE
	3 : SYNCED-ARCHIVE
	4 : SYNCED-LIVECHAT
	5 : SYNCED-LISTENER
*/

function LoadButtons() {
	var target = document.getElementsByTagName("ytd-video-primary-info-renderer");
	var ExtContainer = document.createElement('div');
	ExtContainer.id = "Extcontainer";
	target[0].prepend(ExtContainer);
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
}

async function WaitUntilLoad(){
	while (true){
		var target = document.getElementsByTagName("ytd-video-primary-info-renderer");
		if (target.length != 0){
			if (document.getElementById("Extcontainer") != null){
				var Extcontainer = document.getElementById("Extcontainer");
				Extcontainer.parentNode.removeChild(Extcontainer);
			}
			LoadButtons();
			break;
		} else {
			console.log("Not loaded yet");
		}
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

WaitUntilLoad();