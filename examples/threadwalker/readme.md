# threadwalker

Walks a whole rss.chat conversation using nothing but the RSS feeds, and prints it as an indented outline.

### Why it exists

Every conversation on rss.chat is a set of feeds pointing at each other. A post that has replies carries a `source:comments` element in its feed item, giving the address of a comments feed -- an RSS feed of the replies. Each reply is an ordinary item, and if it has replies of its own, it carries its own `source:comments`. The whole tree is walkable one feed at a time, every level the same shape.

threadwalker proves it. It reads a user's feed, finds the starting post, and follows `source:comments` links down through the thread, printing each post as it goes. It never calls the rss.chat API -- everything comes from static XML files. No account, no key.

### How to run it

You'll need Node.

```
npm install
node walker.js
```

It prints the conversation as an outline -- one line per post, each reply indented under the post it answers.

### Pointing it at another thread

Two constants at the top of walker.js say where to start:

```javascript
const urlStartingFeed = "https://rss.chat/users/manton/rss.xml";
const guidStartingPost = "https://rss.chat/?id=204";
```

Change them to any user's feed and any post's guid. Any post whose feed item carries `source:comments` has a thread to walk.

### Background

The elements this app follows -- `source:comments`, `source:inReplyTo`, and the rest -- are documented at [source.scripting.com](https://source.scripting.com/), with a walkthrough of a real conversation at [RSS as a social network](https://source.scripting.com/social.opml).

Written by Claude Code.
