//threadwalker -- walks a whole rss.chat conversation from the RSS feeds alone, and prints it as an indented outline.
//An example app from the rss.chat repo: https://github.com/scripting/rss.chat/tree/main/examples/threadwalker

const https = require ("https");
const xml2js = require ("xml2js");

const urlStartingFeed = "https://users.rss.network/manton/rss.xml";
const guidStartingPost = "https://rss.chat/?id=204";

function httpGet (url, callback) {
	https.get (url, function (response) {
		var body = "";
		response.on ("data", function (chunk) {
			body += chunk;
			});
		response.on ("end", function () {
			callback (undefined, body);
			});
		}).on ("error", function (err) {
			callback (err);
			});
	}
function readFeedItems (urlFeed, callback) {
	httpGet (urlFeed, function (err, xmltext) {
		if (err) {
			callback (err);
			}
		else {
			xml2js.parseString (xmltext, {explicitArray: false}, function (err, jstruct) {
				if (err) {
					callback (err);
					}
				else {
					var items = jstruct.rss.channel.item;
					if (items === undefined) {
						items = [];
						}
					if (!Array.isArray (items)) {
						items = [items];
						}
					callback (undefined, items);
					}
				});
			}
		});
	}
function printItem (item, indentlevel) {
	var author = "?";
	if (item ["source:account"] !== undefined) {
		author = item ["source:account"]._;
		}
	var theText = item.description;
	if (item ["source:markdown"] !== undefined) {
		theText = item ["source:markdown"];
		}
	console.log ("\t".repeat (indentlevel) + author + ": " + theText.split ("\n") [0]);
	}
function walkComments (item, indentlevel, callback) {
	const comments = item ["source:comments"];
	if (comments === undefined) {
		callback ();
		}
	else {
		readFeedItems (comments.$.feedUrl, function (err, replies) {
			if (err) {
				callback ();
				}
			else {
				var ix = 0;
				function nextReply () {
					if (ix >= replies.length) {
						callback ();
						}
					else {
						const reply = replies [ix++];
						printItem (reply, indentlevel);
						walkComments (reply, indentlevel + 1, nextReply);
						}
					}
				nextReply ();
				}
			});
		}
	}

readFeedItems (urlStartingFeed, function (err, items) {
	if (err) {
		console.log (err.message);
		}
	else {
		items.forEach (function (item) {
			if (item.guid === guidStartingPost) {
				printItem (item, 0);
				walkComments (item, 1, function () {
					});
				}
			});
		}
	});
