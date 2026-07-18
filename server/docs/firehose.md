# The firehose

Every rss.chat server broadcasts everything that happens on it, the moment it happens, over a websocket: every new post, every edit, every like. That stream is the firehose. The shipped client uses it to keep every open timeline current without polling, and it's just as available to any app you write -- connect, listen, and the posts come to you.

There's nothing to sign up for and nothing to send. Open a websocket connection and messages start arriving.

### The address

The firehose is the server's websocket address -- the `urlWebsocketServerForClient` value in its config. For rss.chat it's:

```
wss://rss.chat/
```

and for the demo server, `wss://demo.rss.chat/`. Every instance names its own.

### The messages

Each message is a single text frame: a verb, a carriage return (`\r`), and a JSON payload.

```
newItem\r{"item": {"id": 204, "author": "Dave Winer", ...}}
```

There are two verbs:

1. `newItem` -- a post was just published.
2. `updatedItem` -- an existing post changed: it was edited, or its like count moved.

The payload's `item` is the same item record the HTTP API returns, documented field by field in [the API doc](api.md) -- the author, the text as HTML and markdown, the publication date, the permalink, reply linkage, like counts, all of it.

### Three things a listener should do

1. **Parse defensively.** Split on the first `\r` for the verb, `JSON.parse` the rest. If the JSON doesn't parse or the payload has no `item`, ignore the message -- other verbs may ride the same socket.

2. **Expect repeats.** The same item can arrive more than once within a few seconds. Treat notifications with the same id less than ten seconds apart as one. Both demo apps include a `notSeenRecently` function that does exactly this.

3. **Reconnect.** Connections drop; servers restart. Check the connection on a timer and reopen it when it's gone. The demos retry every ten seconds.

And one thing it shouldn't: send. Listening requires no greeting, and a message the server doesn't recognize can get the connection closed.

### The demos

Two working apps, each a page of code, live in [examples/firehose](../../examples/firehose/):

1. A Node.js command-line app that logs each post as it arrives.
2. A browser page that shows each post's JSON as it flows through.

### Background

This is the same protocol FeedLand uses for its firehose -- a listener written for rss.chat can point at a FeedLand server and vice versa, which is the interop story in miniature. The idea is older than either: open a connection and let the news flow to you.

***

*Written by Claude Code.*

&nbsp;
