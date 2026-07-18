var myVersion = "0.5.32", myProductName = "rss.network";

const daveappserver = require ("daveappserver");
const rss = require ("daverss");
const s3 = require ("daves3");
const utils = require ("daveutils");
const opml = require ("opml");
const fs = require ("fs");
const path = require ("path");
const request = require ("request");     
const davesql = require ("davesql"); 
const turndown = require ("turndown"); //5/3/26 by DW
const autolinker = require ("autolinker"); //7/13/26 by CC

var config = {
	productName: "rssNetwork",
	productNameForDisplay: "rssNetwork", 
	urlServerHomePageSource: "http://scripting.com/code/testing/rssnetwork/client/index.html",
	myDomain: "my.network.org",
	urlServerForClient: "http://my.network.org/",
	urlWebsocketServerForClient: "",
	flWebsocketEnabled: false,
	prefsPath: "prefs.json",
	
	dataPath: "data/",
	maxFeedItems: 100,
	
	rssLanguage: "en-us",
	rssDocs: "http://cyber.law.harvard.edu/rss/rss.html",
	rssMaxFeedItems: 100,
	flRssCloudEnabled: true,
	rssCloudDomain: "rpc.rsscloud.io",
	rssCloudPort: 5337,
	rssCloudPath: "/pleaseNotify",
	rssCloudRegisterProcedure: "",
	rssCloudProtocol:  "http-post",
	
	urlWebsocketServerForClient: "",
	
	rssS3Path: undefined, //7/14/26 by DW
	rssFeedUrl: undefined,
	rssFilename: "rss.xml",
	opmlS3Path: undefined,
	opmlListUrl: undefined,
	
	urlFeedlandServer: "https://feedland.social/",
	urlFeedlandRedirect: "https://feedland.social/?item=",
	
	maxRecentItems: 100, //4/29/26 by DW
	
	urlExtrasOpml: "https://feedland.social/opml?screenname=davewiner&catname=davesources",
	
	robotsText: "User-agent: *\nDisallow: /getitembyguid\nDisallow: /getiteminfo\n", //7/1/26 by DW
	
	urlFavicon: "//s3.amazonaws.com/scripting.com/favicon.ico", //7/14/26 by DW
	
	flFeedsInDatabase: false, //7/15/26 by DW
	};

//misc stuff
	function getExtrasList (callback) { //5/17/26 by DW
		opml.readOutline (config.urlExtrasOpml, function (err, theOutline) {
			if (err) {
				callback (err);
				}
			else {
				function notComment (node) {
					return (!utils.getBoolean (node.isComment));
					}
				var theList = new Array ();
				theOutline.opml.body.subs.forEach (function (item) {
					if (notComment (item)) {
						theList.push (item.xmlUrl);
						}
					});
				callback (undefined, theList);
				}
			});
		}
	function getMysqlVersion (callback) { //11/18/23 by DW
		const sqltext = "select version () as version;";
		davesql.runSqltext (sqltext, function (err, result) {
			var theVersion = undefined;
			if (err) {
				console.log ("getMysqlVersion: err.message == " + err.message);
				}
			else {
				if (result.length == 0) {
					console.log ("getMysqlVersion: result.length == " + result.length);
					}
				else {
					theVersion = result [0].version;
					console.log ("getMysqlVersion: theVersion == " + theVersion);
					}
				}
			callback (undefined, theVersion);
			});
		}
	function getMarkdownFromHtml (htmltext) { //3/28/26 by DW
		const myTurndown = new turndown ();
		const markdowntext = myTurndown.turndown (htmltext);
		return (markdowntext);
		}
	function notifySocketSubscribers (verb, payload, callbackToQualify) { //6/21/26 by CC -- broadcast inline to our own socket clients; modeled on feedland.js
		if (config.flWebsocketEnabled) {
			const flPayloadIsString = false;
			daveappserver.notifySocketSubscribers (verb, payload, flPayloadIsString, callbackToQualify);
			}
		}
	function getCommentsFeedUrl (screenname, idPost) { //7/8/26 by CC
		return (config.rssFeedUrl + screenname + "/comments/" + idPost + ".xml");
		}
	function linkifyUrls (htmltext) { //7/13/26 by CC
		if (htmltext === undefined) {
			return (undefined);
			}
		else {
			const theLinker = new autolinker ({
				urls: true,
				email: false,
				phone: false,
				stripPrefix: false,
				stripTrailingSlash: false,
				newWindow: false
				});
			return (theLinker.link (htmltext));
			}
		}
	function isEmailBlocked (emailaddress) { //7/13/26 by CC
		if (emailaddress === undefined) {
			return (false);
			}
		else {
			try {
				const jstruct = JSON.parse (fs.readFileSync ("config.json"));
				if (jstruct.blockedUsersList === undefined) { //no blocklist
					return (false);
					}
				else {
					const emailLower = utils.stringLower (emailaddress);
					var flBlocked = false;
					jstruct.blockedUsersList.forEach (function (blockedEmail) {
						if (utils.stringLower (blockedEmail) === emailLower) {
							flBlocked = true;
							}
						});
					return (flBlocked);
					}
				}
			catch (err) {
				console.log ("isEmailBlocked: err.message == " + err.message);
				return (false);
				}
			}
		}
	function userIsBlocked (emailaddress, callback) {
		if (isEmailBlocked (emailaddress)) {
			const message = "Can't send the confirming email because the user is not authorized.";
			callback ({message});
			return (true); //consumed
			}
		else {
			return (false); //not consumed
			}
		}
	function initDatabaseUrls () { //7/15/26 by DW
		if (config.flFeedsInDatabase) { //7/15/26 by CC
			if (config.rssFeedUrl === undefined) { //7/15/26 by CC -- feeds served from our domain
				config.rssFeedUrl = config.urlServerForClient + "users/";
				}
			if (config.opmlListUrl === undefined) {
				config.opmlListUrl = config.urlServerForClient + "data/subs.opml";
				}
			}
		}
//sql code
	function convertString (theString) {
		if ((theString === null) || (theString === undefined)) {
			return (undefined);
			}
		if (theString.length === 0) {
			return (undefined);
			}
		return (theString);
		}
	function convertNumber (theNumber) {
		if ((theNumber === null) || (theNumber === undefined)) {
			return (undefined);
			}
		return (theNumber);
		}
	function convertDate (theDate) {
		if ((theDate === null) || (theDate === undefined)) {
			return (undefined);
			}
		const d = new Date (theDate);
		if (isNaN (d)) {
			return (undefined);
			}
		return (d);
		}
	function convertJson (jsontext) {
		if ((jsontext === null) || (jsontext === undefined)) {
			return (undefined);
			}
		const jstruct = JSON.parse (jsontext);
		return (jstruct);
		}
	function convertUser (theUser) {
		return ({
			screenname: convertString (theUser.screenname),
			emailAddress: convertString (theUser.emailAddress),
			emailSecret: convertString (theUser.emailSecret),
			imageUrl:  convertString (theUser.imageUrl), //5/4/26 by DW
			whenCreated: convertDate (theUser.whenCreated),
			whenUpdated: convertDate (theUser.whenUpdated),
			prefs: convertJson (theUser.prefs) //5/16/26 by DW
			});
		}
	function convertItem (theItem) { 
		function getAuthor (theItem) { //6/8/26 by DW
			const feedTitle = convertString (theItem.feedTitle);
			if (feedTitle !== undefined) {
				return (feedTitle);
				}
			else {
				return (convertString (theItem.author));
				}
			}
		const jstruct = {
			id: convertNumber (theItem.id),
			feedUrl: convertString (theItem.feedUrl),
			guid: getPermalinkUrl (theItem), //6/20/26 by DW
			title: convertString (theItem.title),
			inReplyToNum: convertNumber (theItem.inReplyTo), //4/30/26 by DW
			inReplyToUrl: getInReplyToPermalink (convertNumber (theItem.inReplyTo)), //7/5/26 by DW
			link: convertString (theItem.link),
			description: convertString (theItem.description),
			pubDate: convertDate (theItem.pubDate),
			enclosureUrl: convertString (theItem.enclosureUrl),
			enclosureType: convertString (theItem.enclosureType),
			enclosureLength: convertNumber (theItem.enclosureLength),
			whenCreated: convertDate (theItem.whenCreated),
			whenUpdated: convertDate (theItem.whenUpdated),
			markdowntext: convertString (theItem.markdowntext),
			outlineJsontext: convertString (theItem.outlineJsontext),
			imageUrl: convertString (theItem.imageUrl), //5/4/26 by DW
			author: getAuthor (theItem), //6/8/26 by DW
			screenname: convertString (theItem.author), //account id -- 6/8/26
			feedLink: convertString (theItem.feedLink), //6/8/26
			feedDescription: convertString (theItem.feedDescription), //6/8/26
			flDeleted: utils.getBoolean (theItem.flDeleted), //6/12/26 by DW
			ctLikes: convertNumber (theItem.ctLikes), //6/24/26 by DW
			flLiked: utils.getBoolean (theItem.flLiked), //6/24/26 by DW
			inReplyToAuthor: convertString (theItem.inReplyToAuthor), //6/30/26 by DW
			ctReplies: convertNumber (theItem.ctReplies), //7/3/26 by CC
			}
		var theConvertedItem = new Object ();
		for (var x in jstruct) {
			if (jstruct [x] !== undefined) {
				theConvertedItem [x] = jstruct [x];
				}
			}
		return (theConvertedItem);
		}
	function getUserInfoByScreenname (screenname, callback) {
		const sqltext = "select * from users where screenname = " + davesql.encode (screenname) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				if (result.length === 0) {
					callback (undefined, undefined);
					}
				else {
					callback (undefined, convertUser (result [0]));
					}
				}
			});
		}
	function getUserInfoByEmail (email, callback) {
		const sqltext = "select * from users where emailAddress = " + davesql.encode (email) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				if (result.length === 0) {
					callback (undefined, undefined);
					}
				else {
					callback (undefined, convertUser (result [0]));
					}
				}
			});
		}
	function addUser (userRec, callback) {
		const theValues = {
			screenname: userRec.screenname,
			emailAddress: userRec.emailAddress,
			emailSecret: userRec.emailSecret
			};
		const sqltext = "insert into users " + davesql.encodeValues (theValues);
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				updateSubscriptionListOnS3 (); //6/23/26 by DW
				callback (undefined, userRec);
				}
			});
		}
	function updateUser (userRec, callback) {
		function encode (theValue) {
			return (davesql.encode (theValue));
			}
		console.log ("updateUser: userRec.screenname == " + userRec.screenname); //5/10/26 by DW
		const sqltext = "update users set emailAddress = " + encode (userRec.emailAddress) + ", emailSecret = " + encode (userRec.emailSecret) + " where screenname = " + encode (userRec.screenname) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				if (result.affectedRows === 0) {
					const message = "Can't update the user because there is no user with screenname \"" + userRec.screenname + "\".";
					callback ({message});
					}
				else {
					callback (undefined, userRec);
					}
				}
			});
		}
	function getAllScreennames (callback) {
		const sqltext = "select screenname from users;";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				var screennames = new Array ();
				result.forEach (function (row) {
					screennames.push (row.screenname);
					});
				callback (undefined, screennames);
				}
			});
		}
	function addItem (itemRec, callback) {
		const theValues = {
			feedUrl: itemRec.feedUrl,
			title: itemRec.title,
			link: itemRec.link,
			description: itemRec.description,
			inReplyTo: itemRec.inReplyTo, //4/30/26 by DW
			pubDate: itemRec.pubDate,
			enclosureUrl: itemRec.enclosureUrl,
			enclosureType: itemRec.enclosureType,
			enclosureLength: itemRec.enclosureLength,
			markdowntext: itemRec.markdowntext,
			outlineJsontext: itemRec.outlineJsontext,
			author: itemRec.author, //5/4/26 by DW
			};
		const sqltext = "insert into items " + davesql.encodeValues (theValues);
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				itemRec.id = result.insertId;
				callback (undefined, itemRec);
				getItemByGuid (undefined, getPermalinkUrl (itemRec), function (err, item) { //6/21/26 by CC
					if (err) {
						console.log ("addItem: err.message == " + err.message);
						}
					else {
						if (item !== undefined) {
							notifySocketSubscribers ("newItem", {item});
							}
						}
					});
				}
			});
		}
	function updateItem (itemRec, callback) {
		if (itemRec.id === undefined) {
			callback ({message: "Can't update the item because no id was provided."});
			}
		else {
			var setClause = "";
			function add (fieldname, theValue) {
				if (theValue !== undefined) {
					if (setClause.length > 0) {
						setClause += ", ";
						}
					setClause += fieldname + " = " + davesql.encode (theValue);
					}
				}
			add ("feedUrl", itemRec.feedUrl);
			add ("title", itemRec.title);
			add ("link", itemRec.link);
			add ("description", itemRec.description);
			add ("inReplyTo", itemRec.inReplyTo);
			add ("pubDate", itemRec.pubDate);
			add ("enclosureUrl", itemRec.enclosureUrl);
			add ("enclosureType", itemRec.enclosureType);
			add ("enclosureLength", itemRec.enclosureLength);
			add ("markdowntext", itemRec.markdowntext);
			add ("outlineJsontext", itemRec.outlineJsontext);
			add ("author", itemRec.author);
			if (setClause.length === 0) {
				callback ({message: "Can't update the item because no fields were provided."});
				return;
				}
			const sqltext = "update items set " + setClause + " where id = " + davesql.encode (itemRec.id) + ";";
			davesql.runSqltext (sqltext, function (err, result) {
				if (err) {
					callback (err);
					}
				else {
					if (result.affectedRows === 0) {
						callback ({message: "Can't update the item because there is no item with id " + itemRec.id + "."});
						}
					else {
						callback (undefined, itemRec);
						getItemByGuid (undefined, getPermalinkUrl (itemRec), function (err, item) { //6/21/26 by CC -- broadcast the edit to socket clients
							if (err) {
								console.log ("updateItem: err.message == " + err.message);
								}
							else {
								if (item !== undefined) {
									notifySocketSubscribers ("updatedItem", {item});
									}
								}
							});
						}
					}
				});
			}
		}
	function getRecentUserItems (screenname, feedUrl, maxCt, callback) {
		const sqltext = "select items.*, users.prefs ->> '$.myAvatarImageUrl' as imageUrl, users.prefs ->> '$.myFeedTitle' as feedTitle, users.prefs ->> '$.myFeedLink' as feedLink, users.prefs ->> '$.myFeedDescription' as feedDescription, (select count(*) from likes where likes.itemId = items.id) as ctLikes, (select count(*) from likes where likes.itemId = items.id and likes.screenname = " + davesql.encode (screenname) + ") as flLiked, (select count(*) from items c where c.inReplyTo = items.id and (c.flDeleted is null or c.flDeleted = 0)) as ctReplies, (select coalesce (nullif (u2.prefs ->> '$.myFeedTitle', ''), i2.author) from items i2 left join users u2 on u2.screenname = i2.author where i2.id = items.inReplyTo) as inReplyToAuthor from items left join users on users.screenname = items.author where items.feedUrl = " + davesql.encode (feedUrl) + " and (items.flDeleted is null or items.flDeleted = 0) order by pubDate desc limit " + maxCt + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				var items = new Array ();
				result.forEach (function (row) {
					items.push (convertItem (row));
					});
				callback (undefined, items);
				}
			});
		}
	function getRecentItems (screenname, maxCt, callback) { //4/29/26 by DW
		if (maxCt === undefined) {
			maxCt = config.maxRecentItems;
			}
		else {
			maxCt = Number (maxCt); 
			if (maxCt > config.maxRecentItems) {
				maxCt = config.maxRecentItems;
				}
			}
		const sqltext = "select items.*, users.prefs ->> '$.myAvatarImageUrl' as imageUrl, users.prefs ->> '$.myFeedTitle' as feedTitle, users.prefs ->> '$.myFeedLink' as feedLink, users.prefs ->> '$.myFeedDescription' as feedDescription, (select count(*) from likes where likes.itemId = items.id) as ctLikes, (select count(*) from likes where likes.itemId = items.id and likes.screenname = " + davesql.encode (screenname) + ") as flLiked, (select count(*) from items c where c.inReplyTo = items.id and (c.flDeleted is null or c.flDeleted = 0)) as ctReplies, (select coalesce (nullif (u2.prefs ->> '$.myFeedTitle', ''), i2.author) from items i2 left join users u2 on u2.screenname = i2.author where i2.id = items.inReplyTo) as inReplyToAuthor from items left join users on users.screenname = items.author where (items.flDeleted is null or items.flDeleted = 0) order by pubDate desc limit " + davesql.encode (maxCt) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				var items = new Array ();
				result.forEach (function (row) {
					items.push (convertItem (row));
					});
				callback (undefined, items);
				}
			});
		}
	function getItemById (screenname, id, callback) { //6/4/26 by Claude
		const sqltext = "select items.*, (select count(*) from likes where likes.itemId = items.id) as ctLikes, (select count(*) from likes where likes.itemId = items.id and likes.screenname = " + davesql.encode (screenname) + ") as flLiked, (select count(*) from items c where c.inReplyTo = items.id and (c.flDeleted is null or c.flDeleted = 0)) as ctReplies, (select coalesce (nullif (u2.prefs ->> '$.myFeedTitle', ''), i2.author) from items i2 left join users u2 on u2.screenname = i2.author where i2.id = items.inReplyTo) as inReplyToAuthor from items where id = " + davesql.encode (id) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				if (result.length === 0) {
					callback (undefined, undefined);
					}
				else {
					callback (undefined, convertItem (result [0]));
					}
				}
			});
		}
	function getItemByGuid (screenname, guid, callback) { //6/8/26 by DW
		if (guid == undefined) {
			const message = "Can't get the item record because the GUID param is undefined.";
			console.log ("getItemByGuid: " + message);
			console.log ("getItemByGuid: screenname == " + screenname + ", guid == " + guid);
			callback ({message});
			}
		else {
			const theId = utils.stringNthField (guid, "=", 2)
			const sqltext = `
				select
					items.*,
					users.prefs ->> '$.myAvatarImageUrl' as imageUrl,
					users.prefs ->> '$.myFeedTitle' as feedTitle,
					users.prefs ->> '$.myFeedLink' as feedLink,
					users.prefs ->> '$.myFeedDescription' as feedDescription,
					(select count(*) from likes where likes.itemId = items.id) as ctLikes,
					(select count(*) from likes where likes.itemId = items.id and likes.screenname = ${davesql.encode (screenname)}) as flLiked,
					(select count(*) from items c where c.inReplyTo = items.id and (c.flDeleted is null or c.flDeleted = 0)) as ctReplies,
					(select coalesce (nullif (u2.prefs ->> '$.myFeedTitle', ''), i2.author)
						from items i2
						left join users u2 on u2.screenname = i2.author
						where i2.id = items.inReplyTo) as inReplyToAuthor
				from items
				left join users on users.screenname = items.author
				where items.id = ${davesql.encode (theId)};
				`;
			davesql.runSqltext (sqltext, function (err, result) {
				if (err) {
					callback (err);
					}
				else {
					if (result.length === 0) {
						callback (undefined, undefined);
						}
					else {
						const itemRec = convertItem (result [0]);
						if (itemRec.flDeleted) { //7/7/26 by CC
							const message = "Can't view the post because it has been deleted.";
							callback ({message});
							}
						else {
							callback (undefined, itemRec);
							}
						}
					}
				});
			}
		}
	function getItemAndReplies (screenname, idParent, callback) { //6/30/26 by CC
		const sqltext = "select items.*, users.prefs ->> '$.myAvatarImageUrl' as imageUrl, users.prefs ->> '$.myFeedTitle' as feedTitle, users.prefs ->> '$.myFeedLink' as feedLink, users.prefs ->> '$.myFeedDescription' as feedDescription, (select count(*) from likes where likes.itemId = items.id) as ctLikes, (select count(*) from likes where likes.itemId = items.id and likes.screenname = " + davesql.encode (screenname) + ") as flLiked, (select count(*) from items c where c.inReplyTo = items.id and (c.flDeleted is null or c.flDeleted = 0)) as ctReplies, (select coalesce (nullif (u2.prefs ->> '$.myFeedTitle', ''), i2.author) from items i2 left join users u2 on u2.screenname = i2.author where i2.id = items.inReplyTo) as inReplyToAuthor from items left join users on users.screenname = items.author where (items.id = " + davesql.encode (idParent) + " or items.inReplyTo = " + davesql.encode (idParent) + ") and (items.flDeleted is null or items.flDeleted = 0) order by pubDate asc;";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				var items = new Array ();
				result.forEach (function (row) {
					items.push (convertItem (row));
					});
				callback (undefined, items);
				}
			});
		}
	
//feeds
	function backfillCommentsFeeds () { //7/8/26 by DW
		const sqltext = "select distinct i.inReplyTo from items i join items p on p.id = i.inReplyTo where i.inReplyTo is not null and (i.flDeleted is null or i.flDeleted = 0) and (p.flDeleted is null or p.flDeleted = 0);";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				console.log ("backfillCommentsFeeds: err.message == " + err.message);
				}
			else {
				console.log ("backfillCommentsFeeds: publishing " + result.length + " comments feeds.");
				result.forEach (function (row) {
					console.log ("backfillCommentsFeeds: row.inReplyTo == " + row.inReplyTo);
					publishCommentsFeed (row.inReplyTo);
					});
				}
			});
		}
	function backfillFeeds () { //7/15/26 by CC
		getAllScreennames (function (err, theNames) {
			if (err) {
				console.log ("backfillFeeds: err.message == " + err.message);
				}
			else {
				console.log ("backfillFeeds: publishing " + theNames.length + " user feeds.");
				theNames.forEach (function (screenname) {
					getUserInfoByScreenname (screenname, function (err, userRec) {
						if (err) {
							console.log ("backfillFeeds: screenname == " + screenname + ", err.message == " + err.message);
							}
						else {
							buildFeedForUser (userRec, "xml", function (err, xmltext) {
								if (err) {
									console.log ("backfillFeeds: screenname == " + screenname + ", err.message == " + err.message);
									}
								else {
									const relpath = screenname + "/" + config.rssFilename;
									publishFeedFile (relpath, xmltext, function (err, data) {
										if (err) {
											console.log ("backfillFeeds: screenname == " + screenname + ", err.message == " + err.message);
											}
										});
									}
								});
							}
						});
					});
				
				const everyoneFeedUrl = config.rssFeedUrl + config.rssFilename;
				buildFeedForEveryone (everyoneFeedUrl, function (err, xmltext) {
					if (err) {
						console.log ("backfillFeeds: err.message == " + err.message);
						}
					else {
						publishFeedFile (config.rssFilename, xmltext, function (err, data) {
							if (err) {
								console.log ("backfillFeeds: err.message == " + err.message);
								}
							});
						}
					});
				
				backfillCommentsFeeds ();
				}
			});
		}
	function getFeedUrl (screenname) { //4/22/26 by DW
		const relpath = screenname + "/" + config.rssFilename;
		const feedUrl = config.rssFeedUrl + relpath;
		return (feedUrl);
		}
	function getDefaultHeadElements () { //6/3/26 by DW 
		const headElements = {
			language: config.rssLanguage, 
			docs: config.rssDocs,
			maxFeedItems: config.rssMaxFeedItems,
			flRssCloudEnabled: config.rssCloudPort,
			rssCloudDomain: config.rssCloudDomain,
			rssCloudPort: config.rssCloudPort,
			rssCloudPath: config.rssCloudPath,
			rssCloudRegisterProcedure: config.rssCloudRegisterProcedure,
			rssCloudProtocol: config.rssCloudProtocol,
			generator: myProductName + " v" + myVersion,
			}
		return (headElements);
		}
	function publishCommentsFeed (idPost, callback) { //7/8/26 by CC
		buildCommentsFeed (idPost, function (err, xmltext, parentItem) {
			if (err) {
				console.log ("publishCommentsFeed: err.message == " + err.message);
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				const relpath = parentItem.screenname + "/comments/" + idPost + ".xml";
				publishFeedFile (relpath, xmltext, function (err, data) {
					if (err) {
						console.log ("publishCommentsFeed: config.rssS3Path == " + config.rssS3Path + ", err.message == " + err.message);
						if (callback !== undefined) {
							callback (err);
							}
						}
					else {
						if (callback !== undefined) {
							callback (undefined, parentItem);
							}
						}
					});
				}
			});
		}
	function updateReplyFeedsOnS3 (idParent, commenterScreenname) { //7/8/26 by CC
		if (idParent !== undefined) {
			publishCommentsFeed (idParent, function (err, parentItem) {
				if (err) {
					console.log ("updateReplyFeedsOnS3: err.message == " + err.message);
					}
				else {
					if (parentItem.screenname !== commenterScreenname) {
						getUserInfoByScreenname (parentItem.screenname, function (err, parentUserRec) {
							if (err) {
								console.log ("updateReplyFeedsOnS3: err.message == " + err.message);
								}
							else {
								updateFeedsOnS3 (parentUserRec, function (err) {
									if (err) {
										console.log ("updateReplyFeedsOnS3: err.message == " + err.message);
										}
									});
								}
							});
						}
					if (parentItem.inReplyToNum !== undefined) { //7/8/26 by CC
						publishCommentsFeed (parentItem.inReplyToNum);
						}
					}
				});
			}
		}
	function buildFeedItems (items, flSourceAttribution=false) { //6/3/26 by DW
		var feedItems = new Array ();
		items.forEach (function (theItem) {
			var feedItem = {
				text: theItem.description,
				when: theItem.pubDate,
				title: theItem.title,
				link: theItem.link,
				guid: {flPermalink: true, value: theItem.guid},
				markdowntext: theItem.markdowntext,
				};
			if (theItem.enclosureUrl !== undefined) {
				feedItem.enclosure = {
					url: theItem.enclosureUrl,
					type: theItem.enclosureType,
					length: theItem.enclosureLength
					};
				}
			if (theItem.inReplyToUrl !== undefined) { //5/15/26 by DW
				feedItem.inReplyTo = {
					flPermalink: true, 
					value: theItem.inReplyToUrl
					};
				}
			if (theItem.ctReplies > 0) { //7/8/26 by CC
				feedItem.comments = {
					count: theItem.ctReplies,
					feedUrl: getCommentsFeedUrl (theItem.screenname, theItem.id)
					};
				}
			if (flSourceAttribution) { //7/8/26 by CC
				feedItem.source = {
					url: theItem.feedUrl,
					title: theItem.author
					};
				}
			feedItems.push (feedItem);
			});
		return (feedItems);
		}
	function buildFeedForUser (userRec, format="xml", callback) {
		const headElements = getDefaultHeadElements ();
		headElements.title = userRec.screenname + " on rss.network";
		headElements.link = "http://" + config.myDomain + "/";
		headElements.description = "Posts by " + userRec.screenname + " on rss.network";
		const feedUrl = getFeedUrl (userRec.screenname);
		headElements.urlSelf = feedUrl; //7/7/26 by DW
		
		if (userRec.prefs.myFeedTitle !== undefined) { //5/27/26 by DW
			headElements.title = userRec.prefs.myFeedTitle;
			}
		if (userRec.prefs.myFeedLink !== undefined) { 
			headElements.link = userRec.prefs.myFeedLink;
			}
		if (userRec.prefs.myFeedDescription !== undefined) {
			headElements.description = userRec.prefs.myFeedDescription;
			}
		if (userRec.prefs.myAvatarImageUrl !== undefined) {
			headElements.image = {
				url: userRec.prefs.myAvatarImageUrl,
				title: headElements.title,
				link: headElements.link,
				description: headElements.description
				};
			}
		
		headElements.account = { //7/17/26 by CC -- channel-level source:account, where the spec says it goes
			service: config.myDomain,
			name: userRec.screenname
			};
		
		getRecentUserItems (userRec.screenname, feedUrl, config.maxFeedItems, function (err, items) {
			if (err) {
				callback (err);
				}
			else {
				const feedItems = buildFeedItems (items);
				var xmltext, jsontext, lowerformat = utils.stringLower (format); //7/18/26 by DW
				if (lowerformat === "xml") {
					xmltext = rss.buildRssFeed (headElements, feedItems);
					callback (undefined, xmltext, lowerformat);
					}
				else {
					if (lowerformat === "json") {
						jsontext = rss.buildJsonFeed (headElements, feedItems);
						callback (undefined, jsontext, lowerformat);
						}
					else {
						const message = "Can't build the feed because the format \"" + lowerformat + "\" is not supported here.";
						callback ({message});
						}
					}
				}
			});
		}
	function buildCommentsFeed (idPost, callback) { //7/8/26 by CC
		getItemAndReplies (undefined, idPost, function (err, items) {
			if (err) {
				callback (err);
				}
			else {
				if (items.length == 0) {
					const message = "Can't build the comments feed for post " + idPost + " because there is no post with that id.";
					callback ({message});
					}
				else {
					var parentItem, replies = new Array ();
					items.forEach (function (item) {
						if (item.id == idPost) {
							parentItem = item;
							}
						else {
							replies.push (item);
							}
						});
					
					if (parentItem === undefined) { //7/12/26 by CC
						const message = "Can't build the comments feed for post " + idPost + " because the post has been deleted.";
						callback ({message});
						}
					else {
						const headElements = getDefaultHeadElements ();
						var parentName = "post " + idPost;
						if (parentItem.title !== undefined) {
							parentName = "\"" + parentItem.title + "\"";
							}
						headElements.title = "Comments on " + parentName;
						headElements.link = parentItem.guid;
						headElements.description = "Replies to " + parentName + " by " + parentItem.screenname + " on " + config.myDomain;
						headElements.urlSelf = getCommentsFeedUrl (parentItem.screenname, idPost);
						
						const feedItems = buildFeedItems (replies, true); //7/8/26 by DW -- include <source> attributions
						const xmltext = rss.buildRssFeed (headElements, feedItems);
						callback (undefined, xmltext, parentItem);
						}
					}
				}
			});
		}
	function buildFeedForEveryone (feedUrl, callback) { //6/3/26 by DW
		const headElements = getDefaultHeadElements ();
		headElements.title = config.myDomain + ": all posts", //6/24/26 by DW
		headElements.link = "http://" + config.myDomain + "/";
		headElements.description = "Posts from all users on " + config.myDomain;
		headElements.image = {
			url: "https://imgs.scripting.com/2017/08/05/loveRss.png",
			title: headElements.title,
			link: headElements.link,
			description: headElements.description
			};
		headElements.urlSelf = feedUrl; //7/7/26 by DW
		getRecentItems (undefined, config.maxFeedItems, function (err, items) {
			if (err) {
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				const feedItems = buildFeedItems (items, true); //7/8/26 by DW -- add source elements to indicate who the author is
				const xmltext = rss.buildRssFeed (headElements, feedItems);
				if (callback !== undefined) {
					callback (undefined, xmltext);
					}
				}
			});
		}
	function pingCloud (screenname) {
		var urlFeed = "http://" + config.myDomain + "/feed?screenname=" + screenname;
		rss.cloudPing (undefined, urlFeed, function (err) {
			if (err) {
				console.log ("cloudPing error: " + err);
				}
			});
		}
	function updateFeedsOnS3 (userRec, callback) {
		buildFeedForUser (userRec, "xml", function (err, xmltext, format) {
			if (err) {
				console.log ("updateFeedsOnS3: err.message == " + err.message);
				callback (err);
				}
			else {
				const relpath = userRec.screenname + "/" + config.rssFilename;
				console.log ("updateFeedsOnS3: relpath == " + relpath + ", feedUrl == " + config.rssFeedUrl + relpath); //7/13/26 by DW
				publishFeedFile (relpath, xmltext, function (err, data) {
					if (err) {
						console.log ("updateFeedsOnS3: config.rssS3Path == " + config.rssS3Path + ", err.message == " + err.message);
						callback (err);
						}
					else {
						const feedUrl = config.rssFeedUrl + relpath;
						rss.cloudPing (undefined, feedUrl);
						
						const everyoneFeedUrl = config.rssFeedUrl + config.rssFilename;
						buildFeedForEveryone (everyoneFeedUrl, function (err, xmltext) {
							if (err) {
								console.log ("updateFeedsOnS3: err.message == " + err.message);
								}
							else {
								const relpath = config.rssFilename;
								publishFeedFile (relpath, xmltext, function (err, data) {
									if (err) {
										console.log ("updateFeedsOnS3: config.rssS3Path == " + config.rssS3Path + ", err.message == " + err.message);
										}
									else {
										rss.cloudPing (undefined, everyoneFeedUrl);
										}
									});
								}
							});
						callback (undefined, data);
						}
					});
				}
			});
		}
//opml subscription list
	function getSubscriptionList (callback) {
		getAllScreennames (function (err, theNames) {
			if (err) {
				callback (err);
				}
			else {
				const nowstring = new Date ().toGMTString ();
				var theOutline = {
					opml: {
						head: {
							title: "Subscription list for " + myProductName + " running on " + config.myDomain,
							dateModified: nowstring
							},
						body: {
							subs: new Array ()
							}
						}
					};
				theNames.forEach (function (screenname) {
					theOutline.opml.body.subs.push ({
						type: "rss",
						text: screenname,
						xmlUrl: getFeedUrl (screenname)
						});
					});
				const opmltext = opml.stringify (theOutline);
				callback (undefined, opmltext);
				}
			});
		}
	function updateSubscriptionListOnS3 () {
		getSubscriptionList (function (err, opmltext) {
			if (err) {
				console.log ("updateSubscriptionListOnS3: err.message == " + err.message);
				}
			else {
				if (config.flFeedsInDatabase) {
					writeDatabaseFile ("/data/subs.opml", "text/xml", opmltext, function (err, data) {
						if (err) {
							console.log ("updateSubscriptionListOnS3: err.message == " + err.message);
							}
						});
					}
				else {
					s3.newObject (config.opmlS3Path, opmltext, "text/xml", "public-read", function (err, data) {
						if (err) {
							console.log ("updateSubscriptionListOnS3: config.opmlS3Path == " + config.opmlS3Path + ", err.message == " + err.message);
							}
						});
					}
				}
			});
		}
//rest calls
	function getPermalinkUrl (theItem) { //6/20/26 by DW
		const theGuid = config.urlServerForClient + "?id=" + theItem.id;
		return (theGuid);
		}
	function getInReplyToPermalink (id) { //5/15/26 by DW
		if (id !== undefined) {
			const url = config.urlServerForClient + "?id=" + id;
			return (url);
			}
		else {
			return (undefined);
			}
		}
	function getUserData (screenname, callback) {
		var theData = { //6/13/26 by DW
			feedUrlEveryone: config.rssFeedUrl + config.rssFilename, //6/5/26 by DW
			baseFeedUrl: config.rssFeedUrl,
			opmlListUrl: config.opmlListUrl, //6/5/26 by DW
			flWhitelist: config.whitelist !== undefined, //6/10/26 by DW
			urlFeedlandServer: config.urlFeedlandServer,
			serverVersion: myVersion, //7/1/26 by DW
			mySqlVersion: config.mysqlVersion, //7/1/26 by DW
			}
		if (screenname === undefined) {
			callback (undefined, theData);
			}
		else {
			getUserInfoByScreenname (screenname, function (err, theUser) {
				if (err) {
					callback (err);
					}
				else {
					if (theUser === undefined) {
						const message = "Can't get user data for \"" + screenname + "\" because there is no user with that name.";
						callback ({message});
						}
					else {
						const moreData = {
							screenname, //6/9/26 by DW
							feedUrl: getFeedUrl (screenname),
							imageUrl: theUser.imageUrl, //5/16/26 by DW
							whenUserCreated: theUser.whenCreated, //5/16/26 by DW
							whenUserUpdated: theUser.whenUpdated, //5/16/26 by DW
							prefs: theUser.prefs, //5/16/26 by DW
							}
						utils.mergeOptions (moreData, theData);
						callback (undefined, theData);
						}
					}
				})
			}
		}
	function getUserFeed (screenname, format="xml", callback) {
		getUserInfoByScreenname (screenname, function (err, userRec) {
			if (err) {
				callback (err);
				}
			else {
				if (userRec === undefined) {
					const message = "Can't get the feed because there is no user with screenname \"" + screenname + "\".";
					callback ({message});
					}
				else {
					buildFeedForUser (userRec, format, function (err, xmltext, format) {
						if (err) {
							console.log ("getUserFeed: err.message == " + err.message);
							callback (err);
							}
						else {
							callback (undefined, xmltext, format);
							}
						});
					}
				}
			});
		}
	function newPost (email, code, jsontext, callback) {
		if (isEmailBlocked (email)) { //7/13/26 by DW
			const message = "Can't add the post because the user is not authorized.";
			callback ({message});
			}
		else {
			var postRec;
			try {
				postRec = JSON.parse (jsontext)
				}
			catch (err) {
				const message = "Can't add the post because the postRec doesn't parse properly.";
				callback ({message});
				return;
				}
			getUserInfoByEmail (email, function (err, userRec) {
				if (err) {
					callback (err);
					}
				else {
					if (userRec === undefined) {
						const message = "Can't add the post because there is no user with email \"" + email + "\".";
						console.log ("newPost: " + message);
						callback ({message});
						}
					else {
						if (userRec.emailSecret !== code) {
							const message = "Can't add the post because the authorization code is not correct.";
							callback ({message});
							}
						else {
							const theNewItem = {
								title: postRec.title,
								description: linkifyUrls (postRec.description), //7/13/26 by CC -- #175
								markdowntext: postRec.markdowntext, //6/3/26 by DW
								inReplyTo: postRec.inReplyTo,
								feedUrl: getFeedUrl (userRec.screenname),
								pubDate: new Date (),
								author: userRec.screenname, //5/4/26 by DW
								};
							addItem (theNewItem, function (err, itemRec) {
								if (err) {
									callback (err);
									}
								else {
									updateFeedsOnS3 (userRec, function (err, data) {
										if (err) {
											callback (err);
											}
										else {
											itemRec.guid = getPermalinkUrl (itemRec); //6/20/26 by DW
											callback (undefined, itemRec);
											}
										});
									updateReplyFeedsOnS3 (itemRec.inReplyTo, userRec.screenname); //7/8/26 by CC
									}
								});
							}
						}
					}
				});
			}
		}
	function updatePost (email, code, jsontext, callback) { //5/21/26 by DW
		if (isEmailBlocked (email)) { //7/13/26 by DW
			const message = "Can't update the post because the user is not authorized.";
			callback ({message});
			}
		else {
			var postRec;
			try {
				postRec = JSON.parse (jsontext)
				}
			catch (err) {
				const message = "Can't update the post because the postRec doesn't parse properly.";
				callback ({message});
				return;
				}
			getUserInfoByEmail (email, function (err, userRec) {
				if (err) {
					callback (err);
					}
				else {
					if (userRec === undefined) {
						const message = "Can't update the post because there is no user with email \"" + email + "\".";
						callback ({message});
						}
					else {
						if (userRec.emailSecret !== code) {
							const message = "Can't update the post because the authorization code is not correct.";
							console.log ("updatePost: " + message); 
							callback ({message});
							}
						else {
							getItemById (userRec.screenname, postRec.id, function (err, existingItemRec) {
								if (err) {
									callback (err);
									}
								else {
									if (existingItemRec === undefined) {
										const message = "Can't update the post because there is no item with id " + postRec.id + ".";
										callback ({message});
										}
									else {
										if (existingItemRec.author !== userRec.screenname) {
											const message = "Can't update the post because it was written by a different user.";
											callback ({message});
											}
										else {
											postRec.description = linkifyUrls (postRec.description); //7/13/26 by CC -- #175
											updateItem (postRec, function (err, itemRec) {
												if (err) {
													callback (err);
													}
												else {
													updateFeedsOnS3 (userRec, function (err, data) {
														if (err) {
															callback (err);
															}
														else {
															callback (undefined, itemRec);
															}
														});
													updateReplyFeedsOnS3 (existingItemRec.inReplyToNum, userRec.screenname);
													}
												});
											}
										}
									}
								});
							}
						}
					}
				});
			}
		}
	function validateUser (email, code, what, callback) { //6/12/26 by DW
		getUserInfoByEmail (email, function (err, userRec) {
			if (err) {
				callback (err);
				}
			else {
				if (userRec === undefined) {
					const message = "Can't " + what + " post because there is no user with email \"" + email + "\".";
					callback ({message});
					}
				else {
					if (userRec.emailSecret !== code) {
						const message = "Can't "+ what + " because the authorization code is not correct.";
						callback ({message});
						}
					else {
						callback (undefined, userRec);
						}
					}
				}
			});
		}
	function userOwnsItem (userRec, idItem, what, callback) { //6/12/26 by DW
		getItemById (userRec.screenname, idItem, function (err, itemRec) {
			if (err) {
				callback (err);
				}
			else {
				if (itemRec === undefined) {
					const message = "Can't " + what + " the post because there is no item with id " + idItem + ".";
					callback ({message});
					}
				else {
					if (itemRec.author !== userRec.screenname) {
						const message = "Can't " + what + " the post because it was written by a different user.";
						callback ({message});
						}
					else {
						callback (undefined, itemRec);
						}
					}
				}
			});
		}
	function deletePost (email, code, id, callback) { //6/12/26 by DW
		validateUser (email, code, "delete", function (err, userRec) {
			if (err) {
				callback (err);
				}
			else {
				if (id === undefined) {
					const message = "Can't delete the item because no id was provided.";
					callback ({message});
					}
				else {
					userOwnsItem (userRec, id, "delete", function (err, itemRec) {
						if (err) {
							callback (err);
							}
						else {
							const sqltext = "update items set flDeleted = 1 where id = " + davesql.encode (id) + ";";
							davesql.runSqltext (sqltext, function (err, result) {
								if (err) {
									callback (err);
									}
								else {
									if (result.affectedRows === 0) {
										const message = "Can't delete the item because there is no item with id " + id + ".";
										callback ({message});
										}
									else {
										updateFeedsOnS3 (userRec, function (err, data) {
											if (err) {
												callback (err);
												}
											else {
												callback (undefined, itemRec);
												}
											});
										updateReplyFeedsOnS3 (itemRec.inReplyToNum, userRec.screenname);
										}
									}
								});
							}
						});
					}
				}
			});
		}
	function bumpUserHits (screenname, callback) { //7/1/26 by CC
		const sqltext = "update users set ctHits = ctHits + 1, ctHitsToday = case when date (whenLastHit) = date (now ()) then ctHitsToday + 1 else 1 end, whenLastHit = now () where screenname = " + davesql.encode (screenname) + ";";
		davesql.runSqltext (sqltext, function (err) {
			if (err) {
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				if (callback !== undefined) {
					callback (undefined);
					}
				}
			});
		}
	function savePrefs (email, code, jsontext, callback) { //5/16/26 by DW
		getUserInfoByEmail (email, function (err, userRec) {
			if (err) {
				callback (err);
				}
			else {
				if (userRec === undefined) {
					const message = "Can't set the prefs because there is no user with email \"" + email + "\".";
					callback ({message});
					}
				else {
					if (userRec.emailSecret !== code) {
						const message = "Can't set the prefs because the authorization code is not correct.";
						callback ({message});
						}
					else {
						const sqltext = "update users set prefs = " + davesql.encode (jsontext) + " where screenname = " + davesql.encode (userRec.screenname) + ";";
						davesql.runSqltext (sqltext, function (err) {
							if (err) {
								callback (err);
								}
							else {
								bumpUserHits (userRec.screenname); //7/1/26 by DW
								callback (undefined);
								}
							});
						}
					}
				}
			});
		}
	function checkWhitelist (emailaddress, callback) { //6/9/26 by DW
		if (isEmailBlocked (emailaddress)) { //7/13/26 by CC
			callback (undefined, {flWhitelisted: false});
			}
		else {
			fs.readFile ("config.json", function (err, jsontext) {
				var flWhitelisted = false; 
				if (err) {
					console.log ("checkWhitelist: err.message == " + err.message);
					}
				else {
					var jstruct;
					try {
						jstruct = JSON.parse (jsontext);
						if (jstruct.whitelist === undefined) { //no whitelist
							flWhitelisted = true;
							}
						else {
							flWhitelisted = jstruct.whitelist.includes (emailaddress);
							}
						}
					catch (err) {
						console.log ("checkWhitelist: err.message == " + err.message);
						}
					}
				callback (undefined, {flWhitelisted});
				});
			}
		}
	function getLikersList (id, callback) { //6/25/26 by CC 
		const sqltext = "select screenname from likes where itemId = " + davesql.encode (id) + " order by whenCreated;";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				var screennames = new Array ();
				result.forEach (function (row) {
					screennames.push (row.screenname);
					});
				callback (undefined, screennames);
				}
			});
		}
	function getMostActiveToday (callback) { //7/1/26 by CC
		const sqltext = "select screenname, coalesce (nullif (prefs ->> '$.myFeedTitle', ''), screenname) as name, prefs ->> '$.myAvatarImageUrl' as imageUrl, ctHits, ctHitsToday, whenLastHit from users order by ctHitsToday desc, ctHits desc limit 100;";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				var theList = new Array ();
				result.forEach (function (row) {
					const oneRec = {
						screenname: convertString (row.screenname),
						name: convertString (row.name),
						imageUrl: convertString (row.imageUrl),
						ctHits: convertNumber (row.ctHits),
						ctHitsToday: convertNumber (row.ctHitsToday),
						whenLastHit: convertDate (row.whenLastHit)
						};
					theList.push (oneRec);
					});
				callback (undefined, theList);
				}
			});
		}
	function getItemInfo (screenname, guid, id, format, callback) { //7/9/26 by CC & DW
		if (id !== undefined) { //caller can pass id instead of guid
			guid = config.urlServerForClient + "?id=" + id;
			}
		getItemByGuid (screenname, guid, function (err, itemRec) {
			if (err) {
				callback (err);
				}
			else {
				if (itemRec === undefined) {
					const message = "Can't get info about the post " + guid + " because there is no post with that address.";
					callback ({message});
					}
				else {
					switch (format) {
						case undefined: case "rss": 
							const feedItems = buildFeedItems ([itemRec], true);
							callback (undefined, feedItems [0]);
							break;
						case "feedland": 
							callback (undefined, itemRec);
							break;
						default: 
							const message = "Can't get info about the post because there is no format named \"" + format + "\". The formats are \"rss\" and \"feedland\".";
							callback ({message});
							break;
						}
					}
				}
			});
		}
//like -- 6/24/26 by DW
	function addToLikesTable (screenname, itemId, callback) {
		const likesRec = {
			screenname,
			itemId,
			whenCreated: new Date ()
			};
		const sqltext = "replace into likes " + davesql.encodeValues (likesRec);
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				if (callback !== undefined) {
					callback (undefined, likesRec);
					}
				}
			});
		}
	function removeFromLikesTable (screenname, itemId, callback) {
		const sqltext = "delete from likes where screenname = " + davesql.encode (screenname) + " and itemId = " + davesql.encode (itemId) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				if (callback !== undefined) {
					callback (undefined, {});
					}
				}
			});
		}
	function isLiked (screenname, itemId, callback) {
		const sqltext = "select count(*) as ct from likes where screenname = " + davesql.encode (screenname) + " and itemId = " + davesql.encode (itemId) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				const flLiked = result [0].ct > 0;
				callback (undefined, flLiked);
				}
			});
		}
	function toggleLike (screenname, itemId, callback) {
		isLiked (screenname, itemId, function (err, flLiked) {
			if (err) {
				callback (err);
				}
			else {
				function done (err) {
					if (err) {
						callback (err);
						}
					else {
						getItemById (screenname, itemId, function (err, item) {
							if (err) {
								callback (err);
								}
							else {
								notifySocketSubscribers ("updatedItem", {item});
								callback (undefined, item);
								}
							});
						}
					}
				if (flLiked) {
					removeFromLikesTable (screenname, itemId, done);
					}
				else {
					addToLikesTable (screenname, itemId, done);
					}
				}
			});
		}
	
	function toggleLikeEndpoint (email, code, id, callback) { //6/24/26 by DW
		validateUser (email, code, "toggle the like", function (err, userRec) {
			if (err) {
				callback (err);
				}
			else {
				if (id === undefined) {
					const message = "Can't toggle the like because no id was provided.";
					callback ({message});
					}
				else {
					toggleLike (userRec.screenname, id, callback);
					}
				}
			});
		}
	
	
//database files -- 7/15/26 by CC
	function writeDatabaseFile (path, type, filecontents, callback) {
		function getEncodedValues (jstruct) {
			var values = davesql.encodeValues (jstruct);
			values = utils.stringMid (values, 1, values.length - 1); //remove extraneous semicolon at the end
			return (values);
			}
		const now = new Date ();
		const fileRec = {
			path: path.toLowerCase (), //served via theRequest.lowerpath, so stored lowercase
			type,
			filecontents,
			whenCreated: now,
			whenUpdated: now,
			ctSaves: 1
			};
		const onDuplicatePart = "on duplicate key update type = values (type), filecontents = values (filecontents), whenUpdated = " + davesql.encode (now) + ", ctSaves = ctSaves + 1";
		const sqltext = "insert into files " + getEncodedValues (fileRec) + " " + onDuplicatePart + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				if (callback !== undefined) {
					callback (undefined, fileRec);
					}
				}
			});
		}
	function readDatabaseFile (path, callback) {
		const sqltext = "select * from files where path = " + davesql.encode (path) + ";";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				if (result.length == 0) {
					const message = "Can't serve the file " + path + " because there is no file with that path.";
					const code = 404;
					callback ({message, code});
					}
				else {
					callback (undefined, result [0]);
					}
				}
			});
		}
	function publishFeedFile (relpath, xmltext, callback) { //the one place that decides database vs s3
		if (config.flFeedsInDatabase) {
			writeDatabaseFile ("/users/" + relpath, "text/xml", xmltext, callback);
			}
		else {
			const s3path = config.rssS3Path + relpath;
			s3.newObject (s3path, xmltext, "text/xml", "public-read", callback);
			}
		}
//callbacks for daveappserver
	function findUserWithScreenname (screenname, callback) {
		getUserInfoByScreenname (screenname, function (err, userInfo) {
			if (err) {
				console.log ("findUserWithScreenname: screenname == " + screenname + ", err.message == " + err.message);
				callback (false);
				}
			else {
				if (userInfo === undefined) {
					callback (false);
					}
				else {
					callback (true, userInfo);
					}
				}
			});
		}
	function findUserWithEmail (email, callback) {
		getUserInfoByEmail (email, function (err, userInfo) {
			if (err) {
				console.log ("findUserWithEmail: email == " + email + ", err.message == " + err.message);
				callback (false);
				}
			else {
				if (userInfo === undefined) {
					callback (false);
					}
				else {
					callback (true, {
						emailAddress: userInfo.emailAddress, 
						emailSecret: userInfo.emailSecret
						});
					}
				}
			});
		}
	function getScreenNameFromEmail (email, callback) {
		getUserInfoByEmail (email, function (err, userRec) {
			if (err) {
				console.log ("getScreenNameFromEmail: email == " + email + ", err.message == " + err.message);
				callback (err);
				}
			else {
				if (userRec === undefined) {
					const message = "Can't get the user's screenname because the user wasn't found.";
					callback ({message});
					}
				else {
					callback (undefined, userRec.screenname);
					}
				}
			});
		}
	function addEmailToUserInDatabase (screenname, email, magicString, flNewUser, callback) {
		getUserInfoByScreenname (screenname, function (err, userRec) {
			if (err) {
				console.log ("addEmailToUserInDatabase: screenname == " + screenname + ", err.message == " + err.message);
				callback (err);
				}
			else {
				if (userRec === undefined) {
					const emailSecret = utils.getRandomPassword (20);
					const newRec = {
						screenname: screenname,
						emailAddress: email,
						emailSecret: emailSecret
						};
					addUser (newRec, function (err) {
						if (err) {
							callback (err);
							}
						else {
							callback (undefined, emailSecret);
							}
						});
					}
				else {
					callback (undefined, userRec.emailSecret);
					}
				}
			});
		}
	function isUserAdmin (email, callback) {
		callback (false);
		}

function handleHttpRequest (theRequest) {
	const params = theRequest.params;
	
	function returnData (jstruct) {
		if (jstruct === undefined) {
			jstruct = {};
			}
		theRequest.httpReturn (200, "application/json", utils.jsonStringify (jstruct));
		}
	function returnText (theText) { //7/1/26 by DW
		theRequest.httpReturn (200, "text/plain", theText);
		}
	function returnError (err) {
		console.log ("returnError: err.message == " + err.message); //5/10/26 by DW
		theRequest.httpReturn (503, "text/plain", err.message);
		}
	function returnXml (err, xmltext) { //7/18/26 by DW
		if (err) {
			returnError (err);
			}
		else {
			theRequest.httpReturn (200, "text/xml", xmltext);
			}
		}
	function httpReturn (err, data) {
		if (err) {
			if (err.code !== undefined) { //2/22/25 by DW -- let the caller determine the code
				theRequest.httpReturn (err.code, "text/plain", err.message);
				}
			else {
				returnError (err);
				}
			}
		else {
			returnData (data);
			}
		}
	function returnJson (err, jsontext) { //7/18/26 by DW
		if (err) {
			returnError (err);
			}
		else {
			theRequest.httpReturn (200, "application/json", jsontext);
			}
		}
	function returnRedirect (url, code=undefined) {
		var headers = {
			location: url
			};
		if (code === undefined) {
			code = 302;
			}
		theRequest.httpReturn (code, "text/plain", code + " REDIRECT", headers);
		}
		
	
	switch (theRequest.lowerpath) {
		case "/": //7/17/26 by DW
			theRequest.addToPagetable = {
				feedUrlEveryone: config.rssFeedUrl + config.rssFilename
				};
			return (false); //don't consume, pass it through daveappserver
		case "/feed":
			getUserFeed (params.screenname, params.format, function (err, theText, theFormat) {
				if (err) {
					returnError (err);
					}
				else {
					if (theFormat === "xml") {
						returnXml (undefined, theText);
						}
					else {
						if (theFormat === "json") {
							returnJson (undefined, theText);
							}
						}
					}
				});
			return (true);
		case "/newpost":
			newPost (params.emailaddress, params.emailcode, params.jsontext, httpReturn);
			return (true);
		case "/updatepost": //5/21/26 by DW
			updatePost (params.emailaddress, params.emailcode, params.jsontext, httpReturn);
			return (true);
		case "/deletepost": //6/12/26 AM by DW
			deletePost (params.emailaddress, params.emailcode, params.id, httpReturn);
			return (true);
		case "/getuserdata":
			getUserData (params.screenname, httpReturn);
			return (true);
		case "/getsubscriptionlist":
			getSubscriptionList (httpReturn);
			return (true);
		case "/getrecentitems": //4/29/26 by DW
			getRecentItems (params.screenname, params.ct, httpReturn);
			return (true);
		case "/saveprefs": //5/16/26 by DW 
			savePrefs (params.emailaddress, params.emailcode, params.jsontext, httpReturn);
			return (true);
		case "/getitembyguid": //6/8/26 by DW
			if (params.guid == undefined) { //6/30/26 by DW
				console.log ("/getitembyguid: theRequest.sysRequest.url == " + theRequest.sysRequest.url + ", theRequest.sysRequest.headers == " + utils.jsonStringify (theRequest.sysRequest.headers)); 
				}
			getItemByGuid (params.screenname, params.guid, httpReturn);
			return (true);
		case "/checkwhitelist": //6/9/26 by DW
			checkWhitelist (params.emailaddress, httpReturn);
			return (true);
		case "/isuserindatabase": //6/15/26 by DW
			findUserWithScreenname (params.screenname, function (flFound) {
				returnData ({flInDatabase: flFound});
				});
			return (true); 
		case "/isemailindatabase": //6/15/26 by DW
			getUserInfoByEmail (params.email, function (err, userRec) {
				if (err) {
					returnData ({flInDatabase: false});
					}
				else {
					returnData ({flInDatabase: userRec !== undefined});
					}
				});
			return (true); 
		case "/togglelike": //6/24/26 by DW
			toggleLikeEndpoint (params.emailaddress, params.emailcode, params.id, httpReturn);
			return (true);
		case "/getlikerslist": //6/25/26 by CC
			getLikersList (params.id, httpReturn);
			return (true);
		case "/getrecentuseritems": //6/26/26 by DW
			getRecentUserItems (params.screenname, getFeedUrl (params.name), config.maxRecentItems, httpReturn);
			return (true);
		case "/getitemandreplies": //6/30/26 by DW
			getItemAndReplies (params.screenname, params.idparent, httpReturn);
			return (true);
		case "/getmostactivetoday": //7/1/26 by DW
			getMostActiveToday (httpReturn);
			return (true);
		case "/robots.txt": //7/1/26 by DW
			if (config.robotsText.length > 0) {
				returnText (config.robotsText);
				return (true);
				}
		case "/getiteminfo": //7/9/26 by CC
			getItemInfo (params.screenname, params.guid, params.id, params.format, httpReturn);
			return (true);
		case "/sendconfirmingemail": case "/createnewuser": //7/13/26 by CC
			return (userIsBlocked (params.email, httpReturn)); //if block, we prevent daveappserver from doing anything
		case "/favicon.ico": //7/14/26 by DW
			returnRedirect (config.urlFavicon);
			return (true);
		
		default: //7/17/26 by DW
			if (config.flFeedsInDatabase) { //7/15/26 by CC
				if (utils.beginsWith (theRequest.lowerpath, "/users/") || utils.beginsWith (theRequest.lowerpath, "/data/")) {
					readDatabaseFile (theRequest.lowerpath, function (err, fileRec) {
						if (err) {
							theRequest.httpReturn (404, "text/plain", err.message);
							}
						else {
							theRequest.httpReturn (200, fileRec.type, fileRec.filecontents);
							}
						});
					return (true);
					}
				}
			return (false);
		}
	
	
	return (false); // not consumed
	}

function startup () {
	console.log ("startup");
	function everySecond () {
		}
	function everyMinute () {
		}
	utils.readConfig ("config.json", config, function () {
		davesql.start (config.database, function () {
			initDatabaseUrls (); //7/15/26 by DW
			
			var options = {
				urlServerForClient: config.urlServerForClient,
				flWebsocketEnabled: config.flWebsocketEnabled, 
				urlWebsocketServerForClient: config.urlWebsocketServerForClient,
				
				findUserWithScreenname,
				findUserWithEmail,
				getScreenNameFromEmail,
				addEmailToUserInDatabase,
				isUserAdmin,
				
				httpRequest: handleHttpRequest,
				};
			daveappserver.start (options, function (appConfig) { //daveappserver reads our config.json file and returns it
				for (var x in appConfig) {
					config [x] = appConfig [x];
					}
				updateSubscriptionListOnS3 (); //6/24/26 by DW
				utils.runEveryMinute (everyMinute);
				setInterval (everySecond, 1000); 
				getMysqlVersion (function (err, mysqlVersion) { //11/18/23 by DW, 2/1/24; 11:22:16 AM by DW
					config.mysqlVersion = mysqlVersion;
					});
				});
			});
		});
	}

startup ();


