# The API the client calls

This is the HTTP interface between the rss.chat client and its server. The client that ships with the product is one user of this API; anything that can make an HTTP request and parse JSON can be another. If you want to write your own client, a bot, or a bridge to another network, this is the surface you build on.

The examples below use the flagship server at `https://rss.chat/`. If you run your own server, substitute its address.

**Calling from browser-based JavaScript?** There's already a simpler way: [api.js](https://github.com/scripting/rss.chat/blob/main/client/code/api.js), the wrapper the shipped client uses. Every endpoint here is a one-line method on it, with the authentication and response handling done for you -- [here's the doc](../../client/docs/apijs.md), with a complete working page. (Browser only -- from Node, call the HTTP interface below directly.)

### How calls and responses work

Every call is a plain HTTP request with query-string parameters. Reads are GET, writes are POST, but the server does not distinguish -- the parameters carry everything.

Responses are JSON. On success the status is 200 and the body is the result. On failure the status is 503 and the body is a plain-text sentence explaining what went wrong, in the form *"Can't do x because y."* For example:

```
Can't view the post because it has been deleted.
```

A few endpoints return a string (a feed, an OPML document) rather than an object; those are noted below. The string comes back JSON-encoded, so run it through a JSON parser like everything else.

### How authentication works

There are no passwords. A user proves who they are by proving they can read their email, and from then on two values identify them: `emailaddress` and `emailcode`. Every call marked **authenticated** below takes those two extra parameters.

If you're signed in to rss.chat in your browser, you already have your pair:

1. Go to [rss.chat](https://rss.chat/), signed in.
2. Open the browser's JavaScript console.
3. Type `localStorage.rssNetworkMemory` and press Return.
4. There they are -- `email` and `code`. Those go in every authenticated call as `emailaddress` and `emailcode`.

If your app signs users in itself, the credential comes from the confirmation dance:

1. Call `/sendconfirmingemail?email=...&urlredirect=...`. The server mails a confirmation link to that address.
2. The user clicks the link. The server redirects the browser to `urlredirect` with `emailconfirmed=true`, `email`, `code`, and `screenname` added to the query string.
3. Save `email` and `code` -- that pair is the credential. The shipped client keeps it in localStorage, which is why the recipe above works.

New accounts work the same way through `/createnewuser?email=...&name=...&urlredirect=...`, where `name` is the desired screenname. If the server has a whitelist, the email address must be on it; `/checkwhitelist?emailaddress=...` answers `{"flWhitelisted": true}` or `false` (a server with no whitelist answers true for everyone).

A wrong code gets the usual can't-because error.

### Reading posts

None of these require authentication. All of them accept an optional `screenname` parameter naming the *viewer* -- when present, each returned item's `flLiked` reports whether that viewer has liked it.

**`/getrecentitems?ct=N`** -- the most recent posts on the server, newest first, as an array of item records. `ct` is optional and capped at the server's maximum (100 on rss.chat), which is also the default.

Try it: [https://rss.chat/getrecentitems?ct=3](https://rss.chat/getrecentitems?ct=3)

**`/getrecentuseritems?name=X`** -- the most recent posts by one user, newest first. `name` is the author's screenname.

Try it: [https://rss.chat/getrecentuseritems?name=dave](https://rss.chat/getrecentuseritems?name=dave)

**`/getitembyguid?guid=X`** -- one post, looked up by its guid, which is its permalink -- e.g. `https://rss.chat/?id=204`. A deleted post answers with an error saying so, rather than pretending it never existed.

**`/getitemandreplies?idparent=N`** -- a post and its direct replies, oldest first, as one flat array. The parent is the item whose `id` equals `idparent`; the replies are the items whose `inReplyToNum` points at it. This is the call the client makes to show a thread.

**`/getthread?guid=X`** -- a post and its whole subtree of replies, in one call. You can pass `id=N` instead of `guid`. The response is the post's item record with one added member: `replies`, an array of item records in the same shape, each carrying its own `replies` -- the nesting is the threading. A post with no replies omits the member, like every other empty field. You get the post you ask about and everything under it, not the conversation above it -- ask about the root and you get the whole thread. Deleted posts are filtered out, and the reply counts (`ctReplies`) on each item match what's in its `replies` array. This does in one call what walking the `source:comments` feeds does in many -- same tree, either door. (New in server v0.6.4.)

**`/item?id=N`** -- the server-rendered HTML page for one post: author, date, content, and -- for replies -- a link to what it replies to, marked up as an [h-entry](https://microformats.org/wiki/h-entry). This is the page for readers (and machines) that don't run the client app, and it's the `source` URL the server presents when it sends a Webmention: a receiver that fetches it finds the reply and an exact link to its target, which is what verification needs. A deleted post answers 410, which is how receivers learn a reply they stored is gone.

**`/getiteminfo?guid=X&format=rss`** -- the interop version of a single-post read, for apps that speak feed vocabulary rather than this API's. You can pass `id=N` instead of `guid`. Two formats: `rss` (the default) returns the item as it appears in the author's RSS feed, rendered as JSON -- including `source:comments` and `<source>` attribution; `feedland` returns the same item record the other read calls return. Any other format name gets an error naming the two real ones.

Try it: [https://rss.chat/getiteminfo?id=204&format=rss](https://rss.chat/getiteminfo?id=204&format=rss)

### Reading people

**`/getuserdata?screenname=X`** -- a bundle of facts about the server and, if `screenname` is present, about that user: their feed URL, avatar `imageUrl`, `prefs`, and when the account was created and last updated. Without `screenname` you get just the server facts: the everyone-feed URL, the base URL feeds live under, the subscription-list URL, whether there's a whitelist, and the server and MySQL versions. The shipped client calls this at startup.

**`/getlikerslist?id=N`** -- the screennames of everyone who liked a post, in the order they liked it, as an array of strings.

**`/getmostactivetoday`** -- up to 100 users ordered by how active they've been today, each with `screenname`, `name` (their feed title, falling back to the screenname), `imageUrl`, lifetime and today hit counts, and when they were last seen.

**`/getsubscriptionlist`** -- an OPML subscription list with one entry per user on the server: the reading list for the whole network, ready to hand to any feed reader. Returned as a string.

**`/isuserindatabase?screenname=X`** and **`/isemailindatabase?email=X`** -- each answers `{"flInDatabase": true}` or `false`. The signup dialog uses these to catch collisions before they happen.

**`/feed?screenname=X&format=Y`** -- the user's feed, built fresh from the database. `format` is optional: `xml` (the default) returns the RSS document; `json` returns the same feed as JSON -- not a different format, a translation. The structure and the names are RSS 2.0's own, `rss.channel.item`, every element where you'd expect it, rendered in JSON notation instead of XML. Any other format name gets an error naming the two real ones. Note that feeds are normally read from their published static addresses (`https://rss.chat/users/dave/rss.xml`); this call is the live-from-the-database version of the same document.

Try it: [https://rss.chat/feed?screenname=dave](https://rss.chat/feed?screenname=dave) and [https://rss.chat/feed?screenname=dave&format=json](https://rss.chat/feed?screenname=dave&format=json)

### Writing

All writing calls are **authenticated** POSTs.

**`/newpost?jsontext=X`** -- publish a post. `jsontext` is a JSON object carrying the post's body:

```json
{"markdowntext": "Hello from my **first** post through the API."}
```

A complete call, using your `emailaddress` and `emailcode`:

```
curl -X POST -G "https://rss.chat/newpost" \
	--data-urlencode "emailaddress=you@example.com" \
	--data-urlencode "emailcode=YOURCODE" \
	--data-urlencode 'jsontext={"markdowntext": "Hello from my **first** post through the API."}'
```

The response is your finished post. The `guid` is its permanent address, and it's already live in your feed:

```json
{
	"description": "<p>Hello from my <strong>first</strong> post through the API.</p>",
	"markdowntext": "Hello from my **first** post through the API.",
	"feedUrl": "https://rss.chat/users/you/rss.xml",
	"pubDate": "2026-07-27T16:07:55.225Z",
	"author": "you",
	"id": 413,
	"guid": "https://rss.chat/?id=413"
}
```

The other fields, all optional:

- `description` -- the body as HTML, if HTML is what you have.
- `title` -- a title for the post.
- `inReplyTo` -- the `id` of the post you're replying to: `{"markdowntext": "Same here.", "inReplyTo": 204}`. When you read a reply this field comes back named `inReplyToNum`, and the server accepts that name here too -- send whichever you have.
- `link` -- the post's canonical page somewhere else, for posts that started life outside rss.chat -- a WordPress permalink, say. It has to be an absolute http or https URL; anything else is quietly dropped. The link is stored on the item, comes back in every read, and rides in the author's feed as the item's `<link>`. It's also what makes reply notification work: when someone replies to a post that carries a link, the server tells that page about the reply with a [Webmention](https://www.w3.org/TR/webmention/) (see `/item` below). `/updatepost` accepts it too.

Errors come back as a plain sentence, with a 503 status:

```
Can't add the post because the authorization code is not correct.
```

*Note: We store both the HTML and markdown versions of every post because we want to offer flexibility to client apps and editors.*

**`/updatepost?jsontext=X`** -- edit a post. Same shape as `/newpost`, plus `id`, the number of the post you're editing:

```json
{"id": 413, "markdowntext": "Hello from my **first** post through the API, freshly edited."}
```

Only the author can edit a post. The response echoes the post as now stored, and your feed republishes as it does for a new post:

```json
{
	"id": 413,
	"markdowntext": "Hello from my **first** post through the API, freshly edited.",
	"description": "<p>Hello from my <strong>first</strong> post through the API, freshly edited.</p>"
}
```

**`/deletepost?id=N`** -- delete a post. It disappears from feeds and timelines, and reading it answers that it's been deleted. Replies to it survive. Only the author can delete a post.

**`/togglelike?id=N`** -- like a post, or take the like back if it's already there. One call, both directions. The response is the post with its new `ctLikes` and `flLiked`.

**`/saveprefs?jsontext=X`** -- store your preferences object on your user record. The server keeps what you give it and returns it in `/getuserdata`. The shipped client keeps its display name, feed metadata, and avatar URL here.

**`/uploadmedia?type=T`** -- upload an image, or any media item. This is the one write whose payload rides in the request body: base64-encode the file's bytes and send them as the body of the POST, with the content type in the `type` parameter:

```
base64 -i photo.png | curl -X POST "https://rss.chat/uploadmedia?type=image/png&emailaddress=you@example.com&emailcode=YOURCODE" --data-binary @-
```

The decoded size must be within the server's limit -- 2MB by default. The response gives you `url`, the permanent address your picture will be served from -- it's what goes in a post's `img` tag:

```json
{
	"url": "https://rss.chat/media/57",
	"id": 57,
	"type": "image/png",
	"size": 48211
}
```

**`/media/N`** -- fetch a stored media item. The exception in this section: it's a plain unauthenticated GET, because it's the address readers' browsers hit when a post carries a picture. The bytes come back exactly as uploaded, with the content type given at upload; an id that doesn't exist answers 404. Media survives export and import along with everything else, so these addresses are as permanent as post permalinks.

### The item record

Every call that returns posts returns them in this shape. Fields that would be empty are omitted, so check for presence rather than for empty strings.

- `id` -- the post's number on this server.
- `guid` -- the permalink, e.g. `https://rss.chat/?id=204`. This is the post's identity in feeds.
- `title`, `link`, `description`, `markdowntext` -- what the author wrote. `description` is HTML.
- `pubDate` -- when it was published.
- `author` -- the display name (the author's feed title, falling back to their screenname).
- `screenname` -- the account id. Fixed, where the display name can change.
- `feedUrl`, `feedLink`, `feedDescription`, `imageUrl` -- the author's feed address, website, feed description, and avatar.
- `inReplyToNum`, `inReplyToUrl`, `inReplyToAuthor` -- for replies: the parent's id, permalink, and author display name.
- `ctReplies` -- how many direct replies the post has.
- `ctLikes`, `flLiked` -- how many likes, and whether the viewer named in the call's `screenname` parameter is one of them.
- `enclosureUrl`, `enclosureType`, `enclosureLength` -- the enclosure, for posts that carry one.
- `whenCreated`, `whenUpdated` -- database timestamps.

### Hearing about changes as they happen

The server broadcasts over a websocket as posts arrive and change: `newItem` when a post is published and `updatedItem` when one is edited or its like count moves, each carrying the item record. The shipped client uses this to keep every open timeline current without polling, and any app can listen the same way -- the stream is documented in [the firehose doc](firehose.md), with working demo apps in [examples/firehose](../../examples/firehose/). See the [basics doc](../../client/docs/basics.md) for the interop story feeds tell.

***

*How these docs are written: [howWeDocApis.md](howWeDocApis.md).*

*Written by Claude Code.*
