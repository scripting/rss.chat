var myVersion = 0.1, myProductName = "firehoseDemo";

const appConsts = {
	urlSocketServer: "wss://rss.chat/"
	}

var appPrefs = {
	urlSocketServer: undefined
	}

var mySocket = undefined;

const whenStart = new Date ();
var ctMessagesReceived = 0;
var flPrefsChanged = false;

function loadPrefs () {
	if (localStorage.firehoseDemo !== undefined) {
		try {
			const jstruct = JSON.parse (localStorage.firehoseDemo);
			for (var x in jstruct) {
				appPrefs [x] = jstruct [x];
				}
			}
		catch (err) {
			}
		}
	}
function prefsChanged () {
	flPrefsChanged = true;
	}
function savePrefs () {
	localStorage.firehoseDemo = jsonStringify (appPrefs);
	}
function getSocketAddress () {
	var theAddress = getURLParameter ("url");
	if (theAddress == "null") {
		theAddress = (appPrefs.urlSocketServer === undefined) ? appConsts.urlSocketServer : appPrefs.urlSocketServer;
		}
	return (theAddress);
	}
function howLongSince (when) {
	const secs = secondsSince (when), secsInMinute = 60, secsInHour = secsInMinute * 60;
	function round (num) {
		return (Math.round (num))
		}
	if (secs < secsInMinute) {
		return (round (secs) + " seconds");
		}
	else {
		if (secs < secsInHour) {
			return (round (secs / secsInMinute) + " minutes");
			}
		else {
			return (round (secs / secsInHour) + " hours");
			}
		}
	}
function viewJsontext (theObject) {
	function formatJsonWithTabs (theObject) {
		var jsontext = JSON.stringify (theObject, null, '\t');
		jsontext = jsontext.replace (/^(\t*)\}/gm, '$1\t}'); //move closing braces to align with content inside (add one more tab)
		return (jsontext);
		}
	const jsontext = formatJsonWithTabs (theObject);
	$(".divJsonTextarea").text (jsontext);

	var titlestring;
	if (theObject.title === undefined) {
		titlestring = maxStringLength (stripMarkup (theObject.description), 50, false, true);
		}
	else {
		titlestring = maxStringLength (theObject.title, 50, false, true);
		}
	$(".divTitle").text (titlestring);
	}
function nowstring () {
	return (new Date ().toLocaleTimeString ());
	}

function firehoseSocket (userOptions) { //adapted from the shipped client's socket code -- 7/18/26 by CC
	const options = {
		flWebsocketEnabled: true,
		urlSocketServer: undefined,
		maxRetries: 100, //when we lose a connection, we try to reconnect this many times
		ctSecsBetwRetries: 10,
		initialCheckTimeout: 100,
		maxSecsBetwNotifications: 10.1, //a notice on the same id less than x secs apart are considered to be the same one
		handleMessage: function (theCommand, thePayload) {
			}
		};
	mergeOptions (userOptions, options);

	var recentIds = new Object ();
	function notSeenRecently (id) {
		var flSeen = false;
		function ageOut () {
			var newObject = new Object ();
			for (var x in recentIds) {
				if (secondsSince (recentIds [x]) <= options.maxSecsBetwNotifications) {
					newObject [x] = recentIds [x];
					}
				}
			recentIds = newObject;
			}
		ageOut (); //remove expired ids
		for (var x in recentIds) {
			if (id == x) {
				flSeen = true;
				}
			}
		recentIds [id] = new Date ();
		return (!flSeen);
		}

	var theSocket = undefined, idSocketChecker;
	var ctRetries = 0;

	function checkConnection () {
		if (theSocket === undefined) {
			theSocket = new WebSocket (options.urlSocketServer);
			theSocket.onopen = function (evt) {
				ctRetries = 0; //we got through
				console.log ("firehoseSocket: socket connection is open");
				};
			theSocket.onmessage = function (evt) {
				function getPayload (jsontext) {
					var thePayload = undefined;
					try {
						thePayload = JSON.parse (jsontext);
						}
					catch (err) {
						}
					return (thePayload);
					}
				if (evt.data !== undefined) { //no error
					var theCommand = stringNthField (evt.data, "\r", 1);
					var jsontext = stringDelete (evt.data, 1, theCommand.length + 1);
					var thePayload = getPayload (jsontext);
					if (thePayload !== undefined) {
						if (thePayload.item !== undefined) {
							if (notSeenRecently (thePayload.item.id)) {
								options.handleMessage (theCommand, thePayload);
								}
							}
						}
					}
				};
			theSocket.onclose = function (evt) {
				theSocket = undefined;
				if (ctRetries++ >= options.maxRetries) {
					clearInterval (idSocketChecker);
					}
				};
			theSocket.onerror = function (evt) {
				console.log ("firehoseSocket: socket received an error.");
				};
			}
		}

	if (options.flWebsocketEnabled) {
		setTimeout (function () {
			checkConnection ();
			idSocketChecker = setInterval (checkConnection, 1000 * options.ctSecsBetwRetries);
			}, options.initialCheckTimeout);
		}
	}

function handleMessage (theCommand, thePayload) {
	switch (theCommand) {
		case "newItem":
			console.log (nowstring () + " " + theCommand + " " + thePayload.item.feedUrl);
			viewJsontext (thePayload.item);
			ctMessagesReceived++;
			break;
		case "updatedItem":
			console.log (nowstring () + " " + theCommand + " " + thePayload.item.feedUrl);
			viewJsontext (thePayload.item);
			break;
		}
	}

function startup () {
	loadPrefs ();
	console.log ("startup: appPrefs == " + jsonStringify (appPrefs));

	function everySecond () {
		const items = (ctMessagesReceived == 1) ? "item" : "items";
		$(".spCount").html (ctMessagesReceived + " new " + items + " received.");
		$(".spHowLong").text (howLongSince (whenStart));
		if (flPrefsChanged) {
			savePrefs ();
			flPrefsChanged = false;
			}
		}

	const options = {
		urlSocketServer: getSocketAddress (),
		handleMessage
		}
	mySocket = new firehoseSocket (options);

	ctMessagesReceived = 0;

	$(".spSocketServer").text (getSocketAddress ());
	$(".spSocketServer").click (function () {
		function useUrl (url) {
			appPrefs.urlSocketServer = url;
			$(".spSocketServer").text (url);
			savePrefs (); //must save immediately
			location.reload ();
			}
		askDialog ("Address of the socket server:", appPrefs.urlSocketServer, "", function (url, flcancel) {
			if (!flcancel) {
				url = trimWhitespace (url);
				if (url.length == 0) {
					useUrl (undefined);
					}
				else {
					if (beginsWith (url, "wss://")) {
						useUrl (url);
						}
					else {
						alertDialog ("Can't set the socket server because the address must begin with wss://.");
						}
					}
				}
			});
		});

	self.setInterval (everySecond, 1000);
	}
