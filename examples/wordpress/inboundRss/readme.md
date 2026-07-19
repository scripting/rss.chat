# inboundRss

Mirrors posts from rss.chat onto a WordPress site, as they happen.

It's a small browser app -- one page, no server of its own. It listens to an rss.chat server's [firehose](../../../server/docs/firehose.md), and when a post appears in a feed it's watching, it creates the same post on your WordPress site. When the post is edited on rss.chat, the WordPress copy updates to match. The WordPress side goes through [wpIdentity](https://github.com/scripting/wpIdentity), so signing on is the ordinary WordPress.com login -- no passwords stored, no keys to create.

### What you need

1. A WordPress.com account, and a site to receive the posts. A site on your own server works too, if it's connected to WordPress.com with Jetpack.

2. An rss.chat feed to watch -- yours, or anyone's, on any rss.chat server.

That's all. The app runs in your browser.

### Find your WordPress site id

The app identifies the receiving site by a number. To find it:

1. Open your web browser.

2. In the address bar, type this, replacing **yourdomain.com** with your site's address (leave off the "https://" part of your site address): `https://public-api.wordpress.com/rest/v1.1/sites/yourdomain.com`

3. Press Enter. You'll see a page full of text.

4. Near the beginning, look for `"ID":` followed by a number. That number is your site id. It can be hard to spot in the wall of text -- use Edit > Find (Ctrl+F or Cmd+F) and search for **ID** to jump right to it.

If the page says "unknown blog" instead, double-check the spelling of your domain, and make sure the site is on WordPress.com or has Jetpack connected.

### Setup

1. Copy this folder to your machine.

2. Open `code.js` in a text editor. The values to change are at the top of the file, in `appConsts`:

	* `feedUrl` -- the address of the feed to watch. Every post header in rss.chat ends with a feed icon; click it and copy the address, `https://rss.chat/users/dave/rss.xml` for example.

	* `idSite` -- the number you found in the previous section.

	The app figures out which server to listen to from the feed's address -- there's nothing to configure.

3. Save the file. The app has to be served over http -- the WordPress.com sign-on ends by sending your browser back to the app with a credential, and that step can't complete on a page opened straight from a file. Any way you have of serving a folder of files works, including putting it on a web server. If you have [Node.js](https://nodejs.org/), this works from inside the folder:

```
npx http-server -p 8080
```

4. Open `http://localhost:8080` in your browser -- or whatever address you're serving the folder at.

5. Click the WordPress button and sign on to WordPress.com.

6. That's it. Leave the page open. When a new post shows up in the feed you're watching, it appears on your WordPress site a few seconds later. Edits flow through the same way. The browser's JavaScript console narrates everything that comes through.

### Watching more than one feed

`theSites` is a list. Add an entry for each feed you want to mirror -- each pairs a feed with the id of the site its posts go to. The feeds don't have to come from the same rss.chat server; the app opens a connection to each server it needs.

### Limitations

The app only mirrors what happens while the page is open. A post made while it wasn't running doesn't come over on its own -- though if that post is later edited, the app sees the update, doesn't recognize the post, and creates it fresh, dated when it arrived rather than when it was written.

The app listens to each feed's own server, at `wss://` plus the feed's domain. That's where the firehose lives on every server installed the standard way; a server whose websocket is at some other address can't be watched by this app.

### Background

Adapted from [wpInbound](https://github.com/scripting/wpInbound), the app Dave Winer uses to mirror Scripting News posts onto [daveverse.org](https://daveverse.org/), running over FeedLand's firehose. The two firehoses frame their messages the same way and the item records carry the same information, but the messages differ in shape -- FeedLand wraps each item with a record describing its feed, rss.chat sends just the item -- which is why the adaptation was small but not zero. The worknotes file carries the app's history.

Written by Claude Code.&nbsp;
