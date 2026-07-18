const myVersion = "0.1.0", myProductName = "firehoseDemo";

const utils = require ("daveutils");
const websocket = require ("ws");

var config = {
	urlSocketServer: "wss://rss.chat/"
	};

function connectToFirehose (userOptions) { //adapted from the feedlandsocket package -- 7/18/26 by CC
	var options = {
		flWebsocketEnabled: true,
		urlSocketServer: undefined,
		maxRetries: 100, //when we lose a connection, we try to reconnect this many times
		ctSecsBetwRetries: 10,
		initialCheckTimeout: 100,
		maxSecsBetwNotifications: 10.1, //a notice on the same id less than x secs apart are considered to be the same one
		flDebugMessages: true,
		handleMessage: function (theCommand, thePayload) {
			}
		};
	utils.mergeOptions (userOptions, options);

	var recentIds = new Object ();
	function notSeenRecently (id) {
		var flSeen = false;
		function ageOut () {
			var newObject = new Object ();
			for (var x in recentIds) {
				if (utils.secondsSince (recentIds [x]) <= options.maxSecsBetwNotifications) {
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

	var ctRetries = 0, idSocketChecker;

	if (options.flWebsocketEnabled) {
		var mySocket = undefined;
		function checkConnection () {
			if (mySocket === undefined) {
				mySocket = new websocket (options.urlSocketServer);
				if (options.flDebugMessages) {
					console.log ("connectToFirehose: socket created");
					}
				mySocket.onopen = function (evt) {
					ctRetries = 0; //we got through
					if (options.flDebugMessages) {
						console.log ("connectToFirehose: socket connection is open");
						}
					};
				mySocket.onmessage = function (evt) {
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
						var theCommand = utils.stringNthField (evt.data, "\r", 1);
						var jsontext = utils.stringDelete (evt.data, 1, theCommand.length + 1);
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
				mySocket.onclose = function (evt) {
					mySocket = undefined;
					if (ctRetries++ >= options.maxRetries) {
						clearInterval (idSocketChecker);
						}
					};
				mySocket.onerror = function (evt) {
					console.log ("connectToFirehose: socket received an error.");
					};
				}
			}
		setTimeout (function () {
			checkConnection ();
			idSocketChecker = setInterval (checkConnection, 1000 * options.ctSecsBetwRetries);
			}, options.initialCheckTimeout);
		}
	}

function handleMessage (theCommand, thePayload) {
	function nowstring () {
		return (new Date ().toLocaleTimeString ());
		}
	function itemToJson (theItem) {
		var briefObject = new Object ();
		function copyProp (name) {
			if (theItem [name] !== undefined) {
				briefObject [name] = theItem [name];
				}
			}
		copyProp ("id");
		copyProp ("author");
		copyProp ("title");
		copyProp ("pubDate");
		copyProp ("guid");
		return (utils.jsonStringify (briefObject));
		}
	switch (theCommand) {
		case "newItem":
			console.log ("\n" + nowstring () + ": new item == " + itemToJson (thePayload.item));
			break;
		case "updatedItem":
			console.log ("\n" + nowstring () + ": updated item == " + itemToJson (thePayload.item));
			break;
		}
	}

utils.readConfig ("config.json", config, function () {
	console.log ("\nconfig == " + utils.jsonStringify (config) + "\n");
	const options = {
		urlSocketServer: config.urlSocketServer,
		handleMessage
		};
	connectToFirehose (options);
	});
