# The API the client calls

This is the HTTP interface between the rss.chat client and its server. The client that ships with the product is one user of this API; anything that can make an HTTP request and parse JSON can be another. If you want to write your own client, a bot, or a bridge to another network, this is the surface you build on.

The examples below use the flagship server at `https://rss.chat/`. If you run your own server, substitute its address.

### How calls and responses work

Every call is a plain HTTP request with query-string parameters. Reads are GET, writes are POST, but the server does not distinguish -- the parameters carry everything.

Responses are JSON. On success the status is 200 and the body is the result. On failure the status is 503 and the body is a plain-text sentence explaining what went wrong, in the form *"Can't do x because y."* For example:

```
Can't view the post because it has been deleted.
```

A few endpoints return a string (a feed, an OPML document) rather than an object; those are noted below. The string comes back JSON-encoded, so run it through a JSON parser like everything else.

### How authentication works

There are no passwords. A user proves who they are by proving they can read their email.

1. The client calls `/sendconfirmingemail?email=...&urlredirect=...`. The server mails a confirmation link to that address.
2. The user clicks the link. The server redirects the browser to `urlredirect` with `emailconfirmed=true`, `email`, `code`, and `screenname` added to the query string.
3. The client saves `email` and `code` -- that pair is the credential. The shipped client keeps it in localStorage.

New accounts work the same way through `/createnewuser?email=...&name=...&urlredirect=...`, where `name` is the desired screenname. If the server has a whitelist, the email address must be on it; `/checkwhitelist?emailaddress=...` answers `{"flWhitelisted": true}` or `false` (a server with no whitelist answers true for everyone).

Every call marked **authenticated** below takes two extra parameters: `emailaddress` and `emailcode`. The server looks the user up by email and compares the code; a mismatch gets the usual can't-because error.

### Reading posts

None of these require authentication. All of them accept an optional `screenname` parameter naming the *viewer* -- when present, each returned item's `flLiked` reports whether that viewer has liked it.

**`/getrecentitems?ct=N`** -- the most recent posts on the server, newest first, as an array of item records. `ct` is optional and capped at the server's maximum (100 on rss.chat), which is also the default.

Try it: [https://rss.chat/getrecentitems?ct=3](https://rss.chat/getrecentitems?ct=3)

**`/getrecentuseritems?name=X`** -- the most recent posts by one user, newest first. `name` is the author's screenname.

Try it: [https://rss.chat/getrecentuseritems?name=dave](https://rss.chat/getrecentuseritems?name=dave)

**`/getitembyguid?guid=X`** -- one post, looked up by its guid, which is its permalink -- e.g. `https://rss.chat/?id=204`. A deleted post answers with an error saying so, rather than pretending it never existed.

**`/getitemandreplies?idparent=N`** -- a post and its direct replies, oldest first, as one flat array. The parent is the item whose `id` equals `idparent`; the replies are the items whose `inReplyToNum` points at it. This is the call the client makes to show a thread.

**`/getiteminfo?guid=X&format=rss`** -- the interop version of a single-post read, for apps that speak feed vocabulary rather than this API's. You can pass `id=N` instead of `guid`. Two formats: `rss` (the default) returns the item as it appears in the author's RSS feed, rendered as JSON -- including `source:comments` and `<source>` attribution; `feedland` returns the same item record the other read calls return. Any other format name gets an error naming the two real ones.

Try it: [https://rss.chat/getiteminfo?id=204&format=rss](https://rss.chat/getiteminfo?id=204&format=rss)

### Reading people

**`/getuserdata?screenname=X`** -- a bundle of facts about the server and, if `screenname` is present, about that user: their feed URL, avatar `imageUrl`, `prefs`, and when the account was created and last updated. Without `screenname` you get just the server facts: the everyone-feed URL, the base URL feeds live under, the subscription-list URL, whether there's a whitelist, and the server and MySQL versions. The shipped client calls this at startup.

**`/getlikerslist?id=N`** -- the screennames of everyone who liked a post, in the order they liked it, as an array of strings.

**`/getmostactivetoday`** -- up to 100 users ordered by how active they've been today, each with `screenname`, `name` (their feed title, falling back to the screenname), `imageUrl`, lifetime and today hit counts, and when they were last seen.

**`/getsubscriptionlist`** -- an OPML subscription list with one entry per user on the server: the reading list for the whole network, ready to hand to any feed reader. Returned as a string.

**`/isuserindatabase?screenname=X`** and **`/isemailindatabase?email=X`** -- each answers `{"flInDatabase": true}` or `false`. The signup dialog uses these to catch collisions before they happen.

**`/feed?screenname=X`** -- the user's RSS feed, built fresh from the database, returned as a string of XML. Note that feeds are normally read from their published static addresses (`https://rss.chat/users/dave/rss.xml`); this call is the live-from-the-database version of the same document.

### Writing

All writing calls are **authenticated** POSTs.

**`/newpost?jsontext=X`** -- publish a post. `jsontext` is a JSON-encoded object with these fields, all optional except `description`:

- `description` -- the post body, as HTML.
- `markdowntext` -- the body as markdown, if the client has it.
- `title` -- posts can have titles; most don't.
- `inReplyTo` -- the `id` of the post this one replies to.

The server stamps the author, the publication date, and the feed it belongs to -- those are facts about the authenticated caller, not things the caller gets to claim. The response is the completed item record, including the new `id` and `guid`. Publishing also rebuilds and republishes the author's feeds on static storage, and if the post is a reply, the parent post's comments feed and the parent author's feeds too -- the interop machinery rides along on every write.

**`/updatepost?jsontext=X`** -- edit a post. Same `jsontext` shape plus a required `id`. Only the author can update a post; the response is the updated item record, and feeds republish as above.

**`/deletepost?id=N`** -- delete a post. The delete is soft -- the row stays so reply threads hold together, but the post disappears from every feed and every read call answers that it's been deleted. Only the author can delete a post.

**`/togglelike?id=N`** -- like a post, or take the like back if it's already there. One call, both directions. The response is the freshly-read item record, so the caller sees the new `ctLikes` and `flLiked` without a second call.

**`/saveprefs?jsontext=X`** -- store the caller's preferences object on their user record. The prefs are the client's business -- the server stores what it's given and returns it in `/getuserdata`. The shipped client keeps its display name, feed metadata, and avatar URL here.

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

*Written by Claude Code.*
