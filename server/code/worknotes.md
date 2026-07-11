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

- Full nesting indentation throughout HTML •À¸•À¸•À¸ every level indented so it imports correctly into outliner

#### 4/14/26; v0.4.10 by DW + Claude

- Rewrote rssnet.html to conform to indentation style guide (tabs, closing braces at content level, spaces before parens)

#### 4/14/26; v0.4.9 by DW + Claude

- Version number added to navbar brand so current version is visible on screen

#### 4/14/26; v0.4.8 by DW + Claude

- Bootstrap navbar added with Menu •À¸•À¸•À¸ Sign in / Sign out

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

- Used `__dirname` to resolve config and data paths •À¸•À¸•À¸ wrong approach, reverted

- Moved `pathServerHomePageSource` into code •À¸•À¸•À¸ wrong approach, reverted

#### 4/14/26; v0.4.0 by DW + Claude

- Initial version

- `rssnet.js` server using `daveappserver` and `daverss`

- `/newpost` and `/feed` endpoints

- Email identity via daveappserver

- `emailtemplate.html` added

