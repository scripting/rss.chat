# rss.chat basics

### What rss.chat is

rss.chat is a social network. You write posts, read other people's, reply and follow -- the same things you do on Twitter or Bluesky.

What's different is underneath. Every post is an item in an RSS feed, and every user is a feed. The chat window is just a friendly way to read and write those feeds.

That's why there's no lock-in. Anyone can read your posts in any feed reader, or in another app that understands RSS. You don't have to be inside rss.chat to be heard.

### Writing a post

To create a new post, click the big plus in the icon bar to the left of the timeline.

Type your message in the box at the top of the page and send it. It appears in the timeline right away.

There's no length limit. A post can be one line or a long essay.

A title is optional. Add one when the post is article-like, leave it off for a quick note.

You can style your writing -- bold, italic, links -- and the styling travels with the post into your feed, so readers see it the way you wrote it.

### Editing a post

You can change a post after you've published it -- fix a typo, add a thought, rewrite the whole thing.

Click the pencil icon on the post. It opens in the editor; make your change and save. The update replaces the original everywhere it appears, including in your RSS feed.

Editing works on your replies too, not just top-level posts.

### Replying

To reply to a post, click the speech-bubble icon on it. An editor opens; write your reply and send it.

Your reply appears nested under the post you answered, so the conversation stays together, with the newest reply at the top of the thread.

A reply is a post like any other. It lives in your feed, and other people can reply to it in turn.

### Reading the timeline

The timeline shows posts newest-first.

Replies appear beneath the post they answer, so a conversation stays together.

### Profiles

Every name and avatar in the timeline is a link. Click one to open that person's profile.

A profile shows who they are -- display name, handle, and a short description -- followed by all of their posts, newest first, replies included.

Click Back in your browser to return to the timeline, right where you left it.

### Your feed

Every rss.chat user has a public RSS feed. Anyone can subscribe to it in any feed reader to follow you -- no rss.chat account required.

Your feed is the real home of everything you post. rss.chat is one way to read it; a feed reader is another. The writing is yours, and it travels.

Your feed lives at a web address made from your name -- https://rss.chat/users/yourname/rss.xml. For example, dave's feed is at https://rss.chat/users/dave/rss.xml.

Paste that address into any feed reader to follow yourself, or give it to other people so they can follow you wherever they read news.

### Hoist and dehoist

When you want to zoom in on a subject and get the other stuff out of your way, hoist it.

Select a post, then click the pushpin that points down -- it is in the icon bar to the left of the timeline. The timeline goes away, leaving just that post and the replies under it: the whole conversation, nothing else.

If a reply has replies of its own, you can hoist again. Select it and click the down pushpin once more. Each hoist takes you one level deeper into the thread.

To come back out, click the pushpin that points up -- that is dehoist. It backs you out one level at a time. Keep going and you land back on the full timeline, with the cursor on the post you started from, right where you left it.

### The firehose

rss.chat is built on open formats -- RSS under every post, OPML for lists. Everything the client does goes through open interfaces: reading feeds, calling endpoints, listening to the firehose. The firehose is the first one documented here; more will follow.

Every rss.chat instance has a firehose: a live stream of everything happening on that instance, the moment it happens.

It is a WebSocket. Connect to the instance's socket address -- for this instance, wss://rss.chat/ -- and you start receiving messages as posts are created and changed. No polling.

Two kinds of message cross the wire. A newItem message means someone published a post or a reply. An updatedItem message means a post changed -- it was edited, or its like count moved.

Each message carries the full, render-ready item -- the same record the timeline draws -- so you do not have to make a second call to fill in the details.

The record is patterned after FeedLand's, on purpose. We reused its field names instead of inventing our own, so anything that already understands FeedLand can read our firehose. If you build one of your own, please keep the names -- gratuitously renaming things is what makes interop hard.
