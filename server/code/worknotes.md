#### 7/18/26; 12:45 PM ET by CC

**threadwalker caught up with yesterday's feed change.** Ricardo reported on [issue #14](https://github.com/scripting/rss.chat/issues/14) that the walker printed `?` for every author -- it was still reading the item-level `source:account` element that came out of the feeds yesterday. Now it reads what the feeds actually say: replies carry a core RSS `<source>` element naming the author, and in a user's own feed the channel says whose feed it is. Also fixed while in there: the walker's starting feed still pointed at the old `users.rss.network` address, which now answers with a redirect that Node's bare `https.get` won't follow -- it points at `https://rss.chat/users/manton/rss.xml` directly. Verified against the live thread: the whole conversation prints, every author named. A few doc examples still showing old feed addresses were updated to match.

#### 7/18/26; 11:30 AM ET by CC

**The firehose is now documented, with two working demo apps.** Every rss.chat server broadcasts every new post, edit, and like over a websocket the moment it happens -- the same stream the shipped client uses to keep timelines current. As of today there's a doc that tells you how to drink from it -- [firehose.md](../docs/firehose.md): the address, the wire format, the two verbs, and the three things a well-behaved listener does -- and two demo apps in [examples/firehose](../../examples/firehose/) that prove it: a Node command-line app that logs each post as it arrives, and a browser page that shows the JSON flowing through. Each is about a page of code, adapted from the [feedlandSocket](https://github.com/scripting/feedlandSocket) demos -- it's the same protocol FeedLand uses, so a listener written for one can listen to the other. No account, no key: connect and the posts come to you.

#### 7/17/26; 4:05 PM ET by CC

**`source:account` moved to where the spec says it goes.** Our feeds had been putting a `source:account` element inside every item. The [source namespace](https://source.scripting.com/) defines it as a channel-level element — it says whose feed this is, not who wrote an item — and at the item level it was redundant anyway: in the mixed feeds, every item already carries a `<source>` element with the author's feed URL and name. As of today, each user's own feed says it once, in the channel: `<source:account service="rss.chat">dave</source:account>`. The items carry it no more. The everyone feed and the comments feeds have no channel account — they have many authors, and their items keep `<source>` for per-item attribution. If you've been reading the item-level element, read the channel-level one (single-author feeds) or `<source>` (mixed feeds) instead. Already-published feeds keep the old shape until they next rebuild. The report that got this fixed is [issue #9](https://github.com/scripting/rss.chat/issues/9). The channel-level support went into [daverss](https://www.npmjs.com/package/daverss), the shared RSS-building package, as a new optional setting.

#### 7/17/26; 10:15 AM ET by CC

**The home page now announces its own feed.** Every server's home page carries a feed auto-discovery link — the standard `<link rel="alternate">` in the page head, pointing at that server's everyone feed. Point a feed reader at the home page of rss.chat, or demo.rss.chat, or your own install, and it finds the feed by itself, no hunting for the URL. The address is filled in per-instance by a new home-page macro, `[%feedUrlEveryone%]`, so the same template serves every server correctly. Work by DW.

#### 7/16/26; 6:00 PM ET by CC

**The install doc learned from two real installs today.** Scott Hanson tested the new database-mode instructions by having an AI agent do a fresh install on a throwaway server — it worked, and the one thing it had to hunt for became [issue #8](https://github.com/scripting/rss.chat/issues/8): the doc never said what port to point a reverse proxy at. Fixed the same hour: step 8 of [install.md](../docs/install.md) now says the server listens on port 1420 (configurable via `port` in config.json or the PORT environment variable) and websockets have their own port, 1422 (`websocketPort`). Separately, for anyone upgrading an existing S3 server to database mode, the upgrade section gained the step we ourselves missed: a one-line SQL update that rewrites the old feed addresses stored with each post — without it, every rebuilt feed comes up empty. If you run a server from before today, that section is worth a read.

#### 7/15/26; 5:15 PM ET by CC

**The biggest install hurdle is gone. Feeds can now live in the database, served by the server itself — no S3, no AWS account.** A new config setting, `flFeedsInDatabase`, turns it on. When it's true, the server stores its RSS feeds and its subscription list in a new `files` table and serves them from its own domain — your feed is at `https://yourserver/users/yourname/rss.xml`, the subscription list at `https://yourserver/data/subs.opml`, and the four feed-location settings from Monday's note aren't needed at all. When it's false (the built-in default), nothing changes — S3 publishing works exactly as before.

Turning it on for an existing server is one restart: at startup the server backfills — rebuilds every user's feed, every comments feed, and the everyone feed from the database, so the files are all there before the first request. Both of our servers, rss.chat and demo.rss.chat, made the switch today.

One thing the flag can't do for you: subscribers still point at your old S3 addresses. The fix is a redirect where the old feed domain is served. Ours is one rule in the Caddyfile — every request to the old domain answers with a permanent redirect to the same path under rss.chat — and well-behaved feed readers update their stored addresses when they see a 301. Details in [install.md](../docs/install.md), which now describes the database-mode install; S3 remains documented in [config.md](../docs/config.md) for those who want it.

#### 7/14/26; 9:45 AM ET by CC

**Server v0.5.27. The feed-location settings have no built-in defaults anymore.** Yesterday's note told how a new server that didn't set its own S3 locations inherited defaults pointing at rss.chat's folders. As of this version those defaults are gone: `rssS3Path`, `rssFeedUrl`, `opmlS3Path`, and `opmlListUrl` start as undefined, and your config.json supplies the real values — see [Feeds on S3](../docs/config.md#feeds-on-s3) in config.md. rss.chat's own config now sets its four values explicitly, the same as every other install. (`rssFilename` keeps its default, `rss.xml` — that one is right for every server.)

A detail that made this easy to verify: the server rebuilds its subscription list, subs.opml, on startup. Restart with the new settings and the file appears at its new address right away — no waiting for a post to trigger a rebuild.

#### 7/13/26; 7:20 PM ET by CC

**There's a second server now — demo.rss.chat — and standing it up taught the docs some things.** Dave installed it on a different machine, following [install.md](../docs/install.md) for real, start to finish. It's open — no whitelist, anyone can join. Two lessons from the exercise, both now in the docs:

First, every server needs its own S3 locations for feeds. The install initially inherited the defaults, which point at rss.chat's own folders — so the new server was overwriting the original's feeds. config.md now has a [Feeds on S3](../docs/config.md#feeds-on-s3) section covering the four settings, and they're in the example config.json so they're on every installer's list.

Second, websockets need a route in your reverse proxy. Live updates run over a websocket on their own port (`websocketPort`), and the proxy in front of the server has to send upgrade requests there — with Caddy, that's a matcher on your domain plus the Connection/Upgrade headers, proxying to that port. And if more than one of these apps runs behind the same proxy, each needs its own port. Until the route existed, the site worked fine and only live updates were missing — if new posts don't appear without a reload, this is the first place to look.

Also new today: server v0.5.26 adds `blockedUsersList` to config.json — an array of email addresses that can't sign up, sign in, or post. It's checked fresh from the file on every use, so adding an address takes effect immediately, no restart. Case doesn't matter.

#### 7/13/26; 9:30 AM ET by CC

**Server v0.5.25. Bare URLs become links, automatically, when a post saves.** Type or paste a web address into a post and it's clickable when it publishes — no more selecting the text and reaching for the link button. The idea came from a user, [Don Park](https://rss.chat/?id=248), the day before it shipped.

The work happens on the server, in `newPost` and `updatePost`, so every client gets it for free. The post's text passes through the [Autolinker](https://www.npmjs.com/package/autolinker) package on its way to the database — it understands HTML, so it only touches plain text: a URL that's already part of a link, or sitting inside an image tag, is left alone, and the link text is exactly what the writer typed. The stored markdown is untouched — the source stays as written; only the rendered text gets the links.

#### 7/12/26; 11:55 PM ET by CC

**The API has a doc now.** [api.md](../docs/api.md), new in server/docs, documents the HTTP interface between the rss.chat client and its server — every read and write call, the no-passwords email flow, the item record field by field, and the websocket verbs. The client that ships with the product is just one user of this API; the doc is for whoever wants to build the next one.

Also in server/docs: install.md's "An AI can do this install" section moved to the end of the doc — it's a good trick, but not the first thing a new host-runner needs to read.

#### 7/12/26; 11:50 AM ET by CC

**A deleted post can't crash its own comments feed anymore.** There was a sequence that could bring down a feed rebuild: someone replies to a post, the author deletes the post, then the reply gets edited. Rebuilding the comments feed found the parent gone — deleted posts are filtered out of every query — and crashed trying to read it. Now the build answers the way this server always answers: "Can't build the comments feed for post N because the post has been deleted."

Also: this file moved from server/docs to server/code. Worknotes live with the code, because you need the worknotes to read the code.

#### 7/11/26; 7:45 PM ET by CC

**Sign-up and sign-in emails were going to spam. Fixed — no code change.** The cause: `mailSender` was a gmail.com address, but the mail actually goes out through Amazon SES, and Gmail sends mail to spam when the sending server isn't authorized to send for the address's domain — as policy, since 2024. The fix, useful to anyone deploying this server: verify your domain as an identity in the SES console (it hands you three DKIM CNAME records to add to your DNS), then set `mailSender` in config.json to an address on that domain. It doesn't need a real mailbox behind it — rss.chat now sends as hello@rss.chat. Verification took minutes, and the first email after the change landed in the inbox.

#### 7/11/26; 12:50 PM ET by CC

The server moved into the [rss.chat repo](https://github.com/scripting/rss.chat). One repo for the whole product now, organized by part: the server's code is at server/code, and these docs — install, config, and this file — are at server/docs. The software is unchanged; only the address is new.

#### 7/9/26; 6:16 PM by CC

`/getiteminfo` joined `/getitembyguid` in robots.txt's Disallow list — both calls serve individual posts on demand, and we'd rather aggressive crawlers not treat them as an invitation to walk the whole database one post at a time. Feeds remain the front door, and they're static files on S3.

#### 7/9/26; 1:10 PM by CC

Server v0.5.23. There's a new call, `/getiteminfo` — it answers the question a feed can't: what's at the other end of a `source:inReplyTo` link. Give it the address of any post and it returns the post as JSON.

```
curl "https://rss.chat/getiteminfo?guid=https://rss.chat/?id=204"
```

You can pass `id=204` instead of the guid if you have the post number. There are two formats, chosen with the `format` param:

* `rss`, the default — the item in feed vocabulary: description, guid, account, inReplyTo, comments and source, the same names and structures you see in our feeds. If you can read the feeds, you already know how to read this.
* `feedland` — the internal record, the same structure our firehose broadcasts, compatible with FeedLand. Flatter, with ids and counts you can use directly.

Asking for a format that doesn't exist gets an error saying so, and asking for a deleted post gets the standard *Can't view the post because it has been deleted.* — errors are always an object with a `message` property.

There's also a new place to start reading about all of this: [RSS as a social network](https://source.scripting.com/social.opml), a walkthrough that tells the story of one real conversation — a post, its replies, and the feeds that connect them — one element at a time.

#### 7/8/26; 10:50 AM by CC

Server v0.5.21. Comments feeds are live — the feature previewed in the last entry shipped today, and its first real thread was Manton Reece saying hello.

Here's how it works. Any post that has replies now carries a new element in its feed item:

```xml
<source:comments count="1" feedUrl="https://users.rss.network/manton/comments/204.xml"/>
```

The `count` says how many direct replies the post has; the `feedUrl` points at a small RSS feed containing them. That comments feed is a static file on S3, published alongside the user feeds, and its items are ordinary items — description, pubDate, guid, `source:markdown`, `source:inReplyTo` pointing back up at the parent. When a reply has replies of its own, its item carries its own `source:comments`, so an entire conversation is traversable from the feeds alone, one level at a time, every level the same shape.

Because a comments feed mixes authors, each of its items also carries RSS core's `<source>` element for attribution:

```xml
<source url="https://users.rss.network/dave/rss.xml">Dave Winer</source>
```

— the author's display name and the address of their home feed. The everyone feed, which mixes authors the same way, now carries `<source>` on its items too.

The feeds rebuild automatically: adding, editing, or deleting a reply republishes the parent post's comments feed, and also the parent author's own feed, since the count on their post just changed. Live example, the first thread: [manton's feed](https://users.rss.network/manton/rss.xml) → [the comments feed for post 204](https://users.rss.network/manton/comments/204.xml).

Later the same day, two finishing touches. A backfill published comments feeds for all 74 existing conversations, so every feedUrl the feeds advertise now resolves — including the threads that predate the feature. And a subtle case is covered: when you reply to a reply, the middle post's comment count now updates in its parent's comments feed too, so a program walking the tree never hits a level that doesn't know about the one below it. (That one was found by writing a demo app against the feeds — the tree is now walkable all the way down, and we've done it.) `source:comments` is documented in the [source namespace](https://source.scripting.com/).

#### 7/7/26; 1:55 PM by CC

Server v0.5.19. Deleted posts are no longer served. Requesting a deleted post by its permalink now returns an error object with a plain-English message — *Can't view the post because it has been deleted.* — instead of the post's content. If you're building on the API, this is the shape all our errors take: an object with a `message` property.

Server v0.5.20. Every feed the server generates now carries `<source:self>` — the feed's own address, so a feed that's been copied or re-served can always say where it canonically lives. It's part of the [source namespace](https://source.scripting.com/).

Coming next: comments feeds. Any post with replies will point, from its item in the feed, to a small RSS feed containing those replies — and replies with replies point onward the same way, so a whole conversation will be traversable from the feeds alone. The design is settled; the code is next.

#### 7/5/26 by CC

In the RSS feeds the server generates, a reply's `<source:inReplyTo>` element now carries the parent post's actual permalink, for example `https://rss.chat/?id=163`. Follow the link and you're looking at the post being replied to. Before this, the element pointed at a `/parent` URL that was never implemented, so the link led nowhere. If you're building on the feeds, this means reply threads are now traversable from the feed alone. (Server v0.5.18.)

#### 7/3/26; 9:04:53 AM by DW

Switching to just maintaining the server, the client is managed in rss.chat repo.

Changes

took the "testing/" out of the path for this project. 

/scripting.com/code/testing/rssnetwork/ becomes /scripting.com/code/rssnetwork/

all the work was in the build script

nodeEditorSuite.utilities.buildRssNetwork

How to save a copy for Claude to read.

file.writewholefile (user.prefs.claudeFolder + "rssNetwork:misc:buildRssNetwork.opml", op.outlinetoxml (@config.nodeEditor.projects.rssNetwork.scripts))



#### 7/1/26; 10:19:38 AM by DW

new columns in the users table

ctHits, ctHitsToday, whenLastHit

when the user calls savePrefs, we 

if now not in the same day as whenLastHit  

ctHitsToday++

ctHits++

set whenLastHit to now

this will give us a way to see who's using the system most 

really important in startup mode

#### 7/1/26; 9:06:54 AM by DW

In myAboutDialog we were referencing the version for daveAppserver, changed it so it's now referring to the correct version for rssnetwork.js. 

#### 6/20/26; 11:06:05 AM by DW

Changed how permalinks work. 

We no longer store a guid value in the database, instead we compute it when we need it.

The format of the url changed to: https://rss.network/?idstory=1402

Commented all the feedland links, we no longer depend on a feedland running behind our server.

#### 6/18/26; 11:13:06 AM by DW

Commented implementation of signupDialog here, and will include the version in FeedLand Home. So that's the official version. 

#### 6/4/26; 10:37:09 AM by DW -- v0.4.16. 

Fixed various high errors reported by Claude.

#### 6/3/26; 5:09:28 PM by DW

Flattened rssHeadElements in config. If we leave it as a structure, then a config.json file has to change all the values to change on. 

#### 5/16/26; 1:22:02 PM by DW

Added default font and fontsize in body element in styles.css.

Added the skeleton of the prefs user interface, we don't have a way to store them in the database. 

There's a new menu in the right side of the menu, to support logging in and out, and settings. 

Included Ubuntu font. I like it and use it as my default font everywhere. 

#### 5/14/26; 10:30:58 AM by DW

working on twitter-like ui

smoothing out connection between feedland and rssnetwork



suppose i have a feedurl, how do i determine if it's one of our feeds, i only want to see log messages if it's one of ours

all log messages that stay must have timestamp. 

#### 5/10/26; 12:51:59 PM by Claude

In addEmailToUserInDatabase, we can't generate a new emailSecret each time a user confirms a magic link, because email-link scanners (Gmail and others) pre-fetch the URL before the user clicks it. The pre-fetch and the click each call this function, each generates its own secret, and the database ends up with one while the user's browser ends up with the other -- so every post afterwards fails authentication. We mint a secret only on first-time user creation; existing users get back the secret that's already stored. Feedland landed on the same posture in 2022 for the closely-related multi-device version of this problem.

#### 5/3/26; 11:50:21 AM by DW

Added markdowntext support.

#### 5/2/26; 6:17:52 PM by DW

Added placeholder for author in an item record.

#### 5/1/26; 5:09:15 PM by DW

Added the themes data structure. 

Commented out inclusion of chat.css and chat.js

#### 4/30/26; 11:07:18 AM by DW

Added inReplyTo to the items table. 

#### 4/29/26; 10:47:40 AM by DW

New database call -- getRecentItems. Interfaces through the rest interface. 

Editing in client/chat.css and chat.js

* removed all blank lines from chat.css, the code was written by claude as if you'd be reading it in a flat text editor. in an outliner the blank lines are an intrusion. now it's okay to put blank lines in css files, i do it to separate sections from each other. lots of prior art for this. 

* in chatUserInterface, the first declaration should be the container of everything. i had to fumble around to find it (was divPhone). It should always be at the very top.

* in the css code, the names should be defined not standalone, for example, don't define .divHead, define .divChat .divHead. we get in trouble very quickly with naked names like divHead which is pretty common. your css starts interfering with each other. i'm still dealing with code written a long time ago that doesn't make css defs specific enough so as not to interfere. 

#### 4/28/26; 9:44:57 AM by DW

Made it so build script only copies files that haven't changed, should improve performance because writing to Claude is on a remote server and is relatively expensive.  

#### 4/26/26; 11:16:13 AM by DW

Converting from local files to SQL database for user and items info.

Implemented the /permalink call. 

#### 4/25/26; 11:26:57 AM by DW

More and more I'm depending on Claude.ai to keep track of what we do here as things move along. 

#### 4/24/26; 10:24:58 AM by DW

appConsts.flPostItemsLocally, up till now when you enter an item interactively we immediately post it to the timeline. 

i added an option to turn this off because i want the items to show up in the timeline after a roundtrip through the feed, rssCloud, feedLand and the sockets and into the timeline. 

in other words, you get it at the same instant all the other users get it. 

#### 4/22/26; 10:26:11 AM by DW

working on the rss feeds we generate

#### 4/20/26; 5:26:32 PM by DW

Cribbed code for the feedlandSocket object, created its own source file, and will tweak it up here, and set it down in the feedlandsocket repo. 

It should have an api.js like all the other modules. 

#### 4/19/26; 8:14:42 PM by DW

In the morning, continue cleaning up the startup process

There's some remaining stuff from the factoring of rssNetworkServer.

#### 4/18/26; 11:31:33 AM by DW

These were docs included in the code, they belong here in worknotes. 

Each user is stored as data/{screenname}.json:

{

email:       "...",

emailSecret: "...",

screenname:  "...",

posts:       [ { text, when, link }, ... ]   // daverss item format

}

#### 4/18/26; 10:59:47 AM by DW

Getting info from config.json to the code running in the client app. 

When daveappserver returns the home page for the site, it also does a string replace for macros. 

The values of the macros can be anything chosen from config. So it can be told for example what the URL of the server was that launched it. It doesn't need to be hard-coded into the client app.

#### 4/15/26; 8:32:34 AM by DW

Picked up all the loose bits and organized it into a source.opml file. 

Conforms to the spec. 

#### 4/14/26; v0.4.11 by DW + Claude

- Full nesting indentation throughout HTML — every level indented so it imports correctly into outliner

#### 4/14/26; v0.4.10 by DW + Claude

- Rewrote rssnet.html to conform to indentation style guide (tabs, closing braces at content level, spaces before parens)

#### 4/14/26; v0.4.9 by DW + Claude

- Version number added to navbar brand so current version is visible on screen

#### 4/14/26; v0.4.8 by DW + Claude

- Bootstrap navbar added with Menu — Sign in / Sign out

- `rssNetworkMemory` localStorage object stores email, code, screenname

- On load, checks URL for `emailconfirmed=true` params, saves to memory, clears URL

- Input bar disabled with "Sign in to post" placeholder when not logged in

- `window.sendItem` POSTs to `/newpost` with stored credentials

- Mock items removed

- FeedLand socket removed

#### 4/14/26; v0.4.7 by DW + Claude

- Config loading switched from `copyScalars` to `mergeOptions`

#### 4/14/26; v0.4.6 by DW + Claude

- Default `config` object added to `rssnet.js` with `rssHeadElements` and all required daverss fields

- `buildFeedForUser` copies `config.rssHeadElements` and sets per-user fields on the copy

- `myProductName` constant added

- `rssHeadElements` removed from `config.json` (now lives in code as defaults)

#### 4/14/26; v0.4.5 by DW + Claude

- `rssHeadElements` added to `config.json` with all required daverss fields including `maxFeedItems`, `language`, `docs`, rssCloud settings

- `buildFeedForUser` updated to use `config.rssHeadElements` as base for head object

#### 4/14/26; v0.4.4 by DW + Claude

- `title` field added to post objects so daverss includes items in the feed

#### 4/14/26; v0.4.3 by DW + Claude

- `addEmailToUserInDatabase` now also updates `email` field when an existing user re-confirms

#### 4/14/26; v0.4.2 by DW + Claude

- Reverted rogue `__dirname` changes from v0.4.1

- `rssnet.html` added to deploy folder

#### 4/14/26; v0.4.1 by Claude

- Used `__dirname` to resolve config and data paths — wrong approach, reverted

- Moved `pathServerHomePageSource` into code — wrong approach, reverted

#### 4/14/26; v0.4.0 by DW + Claude

- Initial version

- `rssnet.js` server using `daveappserver` and `daverss`

- `/newpost` and `/feed` endpoints

- Email identity via daveappserver

- `emailtemplate.html` added
