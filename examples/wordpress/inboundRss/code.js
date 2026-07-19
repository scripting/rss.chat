var myVersion = 0.62, myProductName = "inboundRss";

const appConsts = {
	ctDaysBeforeRemovingPost: 5,

	theSites: [
		{
			feedUrl: "https://myserver.chat/users/bullmancuso/rss.xml", //the feed we'll follow
			idSite: 123456789 //the id of the WordPress site the posts go to
			}
		],
	}

var appPrefs = {
	thePosts: new Array (),
	theLog: new Array ()
	}

var theFirehoseSockets = new Array (); //one per distinct server, assigned in startup
var myWordpress = undefined;

const whenStart = new Date ();
var flPrefsChanged = false;

function loadPrefs () { //9/22/25 by DW
	if (localStorage.inboundRss !== undefined) {
		try {
			const jstruct = JSON.parse (localStorage.inboundRss);
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
	localStorage.inboundRss = jsonStringify (appPrefs);
	}

function nowstring () {
	return (new Date ().toLocaleTimeString ());
	}
function shortText (theText) {
	const shortText = maxStringLength (stringNthField (theText, "\n", 1), 50);
	return (shortText);
	}

function addToLog (theEvent, thePost) {
	const theFeedItem = thePost.theFeedItem;
	const theDraft = thePost.theDraft;

	appPrefs.theLog.push ({
		theEvent,
		idItem: theFeedItem.id,
		url: (theDraft === undefined) ? undefined : theDraft.url,
		theText: theFeedItem.markdowntext,
		when: new Date ().toLocaleString ()
		});

	const mdtext = shortText (theFeedItem.markdowntext);

	console.log (nowstring () + ", " + theEvent + ", theFeedItem.id = " + theFeedItem.id + ", theDraft.url == " + theDraft.url + ", theFeedItem.markdowntext == " + mdtext + "\n");
	}

function getSocketAddress (feedUrl) { //the feed's server broadcasts the firehose -- at wss:// plus the feed's own domain on a standard install
	const theHost = new URL (feedUrl).host;
	return ("wss://" + theHost + "/");
	}
function findSite (feedUrl) {
	var theSite = undefined;
	appConsts.theSites.forEach (function (item) {
		if (item.feedUrl == feedUrl) {
			theSite = item;
			}
		});
	return (theSite);
	}
function findPost (id) {
	var thePost = undefined;
	appPrefs.thePosts.forEach (function (item) {
		if (item.id == id) {
			thePost = item;
			}
		});
	return (thePost);
	}

function removeOldPosts () {
	const maxSecs = appConsts.ctDaysBeforeRemovingPost * 60 * 60 * 24;
	var newPostArray = new Array (), flChanged = false;
	appPrefs.thePosts.forEach (function (item) {
		const when = new Date (item.theDraft.whenCreated);
		if (secondsSince (when) < maxSecs) {
			newPostArray.push (item);
			}
		else {
			flChanged = true;
			}
		});
	if (flChanged) {
		appPrefs.thePosts = newPostArray;
		prefsChanged ();
		}
	}
function processMarkdown (mdtext) {
	const pattern = /^!\[\]\(([^)]*)\)/;
	var processedText = mdtext.replace (pattern, function (whole, url) {
		return ("<img src=\"" + url + "\" style=\"float: right; padding-left: 25px; padding-bottom: 10px; padding-top: 10px; padding-right: 15px;\">");
		});

	var md = new Markdown.Converter (); //4/14/26 by DW
	processedText = md.makeHtml (processedText);

	return (processedText);
	}

function newWordlandPost (theSite, theFeedItem, callback) {
	const theUserInfo = myWordpress.getUserInfoSync ();
	const thePost = {
		id: theFeedItem.id,
		theSite,
		theFeedItem,
		ctUpdates: 0,
		whenLastUpdate: new Date ().toLocaleString ()
		};
	appPrefs.thePosts.push (thePost);
	prefsChanged ();

	const theDraft = {
		title: "",
		content: "",
		categories: [],
		idPost: undefined,
		idSite: undefined,
		flEnablePublish: false,
		whichEditor: "markdown",
		author: {
			id: theUserInfo.idUser,
			username: theUserInfo.username,
			name: theUserInfo.name
			},
		whenCreated: new Date ()
		}
	theDraft.content = processMarkdown (theFeedItem.markdowntext); //fixes up images so they float on the right of the text
	theDraft.title = theFeedItem.title; //11/16/25 by DW
	const idSite = theSite.idSite;
	myWordpress.addPost (idSite, theDraft, function (err, theNewPost) { //5/7/25 by DW
		if (err) {
			console.log ("newWordlandPost: err.message == " + err.message);
			}
		else {
			theDraft.idSite = theNewPost.idSite;
			theDraft.idPost = theNewPost.idPost;
			theDraft.url = theNewPost.url;
			theDraft.whenCreated = theNewPost.whenCreated;
			theDraft.whenPublished = theNewPost.whenPublished;
			theDraft.author = theNewPost.author;
			theDraft.flEnablePublish = false;
			thePost.theDraft = theDraft;
			prefsChanged ();
			addToLog ("newPost", thePost);
			}
		});
	}
function updateWordlandPost (thePost, theUpdatedItem) {
	const oldtext = thePost.theFeedItem.markdowntext;
	const newtext = theUpdatedItem.markdowntext;

	const oldtitle = thePost.theFeedItem.title;
	const newtitle = theUpdatedItem.title;

	const flUpdate = (newtext !== oldtext) || (newtitle !== oldtitle);

	if (flUpdate) {
		const theDraft = thePost.theDraft;
		theDraft.content = processMarkdown (newtext);
		theDraft.title = newtitle; //11/15/25 by DW
		thePost.ctUpdates++;
		thePost.whenLastUpdate = new Date ().toLocaleString ();
		thePost.theFeedItem = theUpdatedItem;
		prefsChanged ();
		addToLog ("updatePost", thePost);
		myWordpress.updatePost (theDraft.idSite, theDraft.idPost, theDraft, function (err, theUpdatedPost) {
			if (err) {
				console.log ("updateWordlandPost: err.message == " + err.message);
				}
			else {
				theDraft.whenPublished = theUpdatedPost.whenPublished;
				theDraft.flEnablePublish = false;
				thePost.theDraft = theDraft;
				prefsChanged ();
				}
			});
		}
	}

function handleItem (flNew, theItem) {
	const theSite = findSite (theItem.feedUrl);
	if (theSite !== undefined) {
		const msg = (flNew) ? "new" : "updated";
		const mdtext = shortText (stripMarkup (processMarkdown (theItem.markdowntext)));
		console.log (nowstring () + ", " + msg + " theItem.id == " + theItem.id + ", theItem.feedUrl == " + theItem.feedUrl + ", theItem.markdowntext == " + mdtext);

		const thePost = findPost (theItem.id);
		if (thePost === undefined) { //it's new
			newWordlandPost (theSite, theItem);
			}
		else {
			updateWordlandPost (thePost, theItem);
			}
		}
	}
function handleMessage (theCommand, thePayload) {
	switch (theCommand) {
		case "newItem":
			handleItem (true, thePayload.item);
			break;
		case "updatedItem":
			handleItem (false, thePayload.item);
			break;
		}
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
				console.log ("firehoseSocket: connected to " + options.urlSocketServer);
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

function updateForLogin (flConnected) {
	var idActive, idOther;
	if (flConnected === undefined) {
		flConnected = myWordpress.userIsSignedIn ()
		}
	if (flConnected) {
		idActive = "#idSignedOn";
		idOther = "#idSignedOff";
		}
	else {
		idActive = "#idSignedOff";
		idOther = "#idSignedOn";
		}
	if ($(idActive).css ("display") != "block") {
		$(idActive).css ("display", "block")
		}
	if ($(idOther).css ("display") != "none") {
		$(idOther).css ("display", "none")
		}
	}

function startup () {
	loadPrefs ();
	console.log ("startup");

	function everyMinute () {
		removeOldPosts ();
		}
	function everySecond () {
		if (flPrefsChanged) {
			savePrefs ();
			flPrefsChanged = false;
			}
		}
	var socketAddresses = new Array ();
	appConsts.theSites.forEach (function (theSite) {
		const theAddress = getSocketAddress (theSite.feedUrl);
		var flFound = false;
		socketAddresses.forEach (function (item) {
			if (item === theAddress) {
				flFound = true;
				}
			});
		if (!flFound) {
			socketAddresses.push (theAddress);
			}
		});
	socketAddresses.forEach (function (theAddress) {
		const options = {
			urlSocketServer: theAddress,
			handleMessage
			}
		theFirehoseSockets.push (new firehoseSocket (options));
		});

	const wpOptions = {
		serverAddress: "https://wordland.social/",
		flWebsocketEnabled: false, //this app doesn't use WordLand's socket, only the firehose
		flWatchSocketForOtherCopies: false //don't interrupt this app if the user runs wordland on another machine
		}
	myWordpress = new wordpress (wpOptions);
	myWordpress.startup (function (err) {
		if (err) {
			alertDialog ("Can't run the app because there was an error starting up.");
			}
		else {
			updateForLogin ();
			}
		});

	self.setInterval (everySecond, 1000);
	runEveryMinute (everyMinute);
	}
