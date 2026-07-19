# firehose

Two small apps that listen to an rss.chat server's firehose -- the websocket stream every server broadcasts, carrying every new post and every edit the moment it happens.

The firehose itself is documented in [the firehose doc](../../server/docs/firehose.md). These apps are the working proof: connect, listen, and the posts come to you. No account, no key.

* [node](node/) -- a command-line app that logs each post to the console as it arrives.
* [browser](browser/) -- a web page that shows each post's JSON as it flows through, with a running count.

### The node demo

You'll need [Node.js](https://nodejs.org/).

1. Copy the `node` folder to your machine.

2. In that folder, install the two packages it uses:

```
npm install
```

3. Run it:

```
node demo.js
```

It connects to `wss://rss.chat/` and waits. When anyone on rss.chat posts, edits, or likes, a line appears in the console with the item's id, author, publication date, and permalink. Leave it running and watch the network go by.

### The browser demo

1. Copy the `browser` folder to your machine.

2. Open `index.html` in your browser. That's it -- no build step, no server.

The page connects and waits. Each arriving post fills the box with the item's full JSON record, and the line below counts what's come through. Open the JavaScript console for a log of every message.

### Pointing at another server

Both demos work with any rss.chat server -- the address they connect to is the `urlWebsocketServerForClient` value from that server's config, `wss://demo.rss.chat/` for example.

1. Node: create a `config.json` file next to `demo.js`:

```json
{
	"urlSocketServer": "wss://demo.rss.chat/"
	}
```

2. Browser: add the address to the page's URL as a `url` parameter (`index.html?url=wss://demo.rss.chat/`), or click the server address at the bottom of the page and type a new one.

### Background

FeedLand's firehose works the same way -- same framing, and item records carrying the same information -- but the messages differ in shape: FeedLand wraps each item with a record describing its feed, rss.chat sends just the item. A listener written for one needs a small adjustment to listen to the other. The original demos these are adapted from live in the [feedlandSocket repo](https://github.com/scripting/feedlandSocket).

Written by Claude Code.
