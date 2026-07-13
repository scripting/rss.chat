# How to install an RSS.chat server

## How to set up a server

1. [Download the repo](https://github.com/scripting/rss.chat/archive/refs/heads/main.zip) and unzip it.
2. Throw away everything but the *code* sub-folder of the server folder.
3. Inside the code folder, these are the files you need: config.json, emailtemplate.html, package.json, rssnetwork.js. You can remove the rest.
4. Put the code folder wherever you want the server to run, on the machine that will run it.
5. Open config.json in a text editor and replace the example values with your own. Every setting is explained in [config.md](config.md).
6. Create your database -- paste the SQL from the next section at a `mysql>` prompt.
7. In the code folder, run `npm install`.
8. Start the server: `node rssnetwork.js`.

## Create your database

The server uses MySQL. Paste the following at a `mysql>` prompt. Change `myRssChat` to whatever name you want, and update `config.json` to match.

```sql
create database myRssChat character set utf8mb4 collate utf8mb4_unicode_ci;

use myRssChat;

create table users (
	screenname varchar (255) not null,
	emailAddress varchar (255),
	emailSecret varchar (64),
	prefs json,
	ctHits int not null default 0,
	ctHitsToday int not null default 0,
	whenLastHit datetime,
	whenCreated datetime default current_timestamp,
	whenUpdated datetime default current_timestamp on update current_timestamp,
	primary key (screenname),
	index emailAddress (emailAddress)
	) character set utf8mb4 collate utf8mb4_unicode_ci;

create table items (
	id int unsigned not null auto_increment,
	feedUrl varchar (512),
	author varchar (255),
	inReplyTo int unsigned,
	title text,
	link text,
	description longtext,
	pubDate datetime,
	enclosureUrl text,
	enclosureType text,
	enclosureLength int,
	whenCreated datetime default current_timestamp,
	whenUpdated datetime default current_timestamp on update current_timestamp,
	markdowntext longtext,
	outlineJsontext text,
	flDeleted tinyint (1) not null default 0,
	primary key (id),
	index feedUrl (feedUrl),
	index author (author)
	) character set utf8mb4 collate utf8mb4_unicode_ci;

create table likes (
	screenname varchar (255),
	itemId int unsigned,
	whenCreated datetime default current_timestamp,
	primary key (screenname, itemId),
	index itemId (itemId)
	) character set utf8mb4 collate utf8mb4_unicode_ci;
```

### Notes on the schema

**users** -- one row per signed-in user. `screenname` is the primary key; `emailAddress` is indexed because the magic-link flow looks users up by email. `emailSecret` holds the rotating confirmation code.

- `ctHits`, `ctHitsToday`, and `whenLastHit` record how active each user is, which matters most when a server is young and you want to see who is really using it. A single function, `bumpUserHits`, updates all three in one write: it adds one to `ctHits` (the lifetime count), sets `ctHitsToday` to one more than its current value when the last hit fell on the same calendar day and resets it to one otherwise (the day rollover is computed in SQL against the row's own `whenLastHit`, so no in-memory state is involved), and stamps `whenLastHit` with the current time. The server calls it after an authenticated user action worth counting -- today that is `savePrefs` -- and any future call site works the same way.

**items** -- one row per posted item. Mirrors FeedLand's items table where the columns overlap, so anyone familiar with FeedLand will recognize the shape.

- `feedUrl` is the partition key for items, indexed.
- `author` is the poster's screenname, indexed because the item-read queries join `users` on it.
- `inReplyTo` is the `id` of the item this one replies to, for threading.
- `description` is the HTML the client sent; `markdowntext` is the markdown derived from it via turndown. The feed emits both.
- `outlineJsontext` is reserved for outline-typed posts (richer post types per the textcasting spec).
- `title`, `link`, and the `enclosure*` columns are optional -- most chat-style posts have only `description`.
- `flDeleted` marks a soft-deleted item. A delete sets the flag rather than removing the row, so reply threads stay intact; the item-reading queries filter it out. Matches FeedLand's `flDeleted`.
- `whenCreated` and `whenUpdated` auto-populate via the schema defaults.

**likes** -- one row per (user, item) like. The primary key `(screenname, itemId)` makes a like idempotent (you can't like the same item twice) and the toggle a single insert or delete. There is no copy of the like data on the item row -- the item-read queries compute `ctLikes` (a count) and `flLiked` (does the current viewer have a row) on the fly, which is what the `itemId` index is for. Unlike FeedLand, which keeps a denormalized list of likers stamped on each item, this is the single source of truth.

### Upgrading an existing database

The block above is for a fresh install. If you already have a running server from an earlier version, add the `likes` table on its own:

```sql
create table likes (
	screenname varchar (255),
	itemId int unsigned,
	whenCreated datetime default current_timestamp,
	primary key (screenname, itemId),
	index itemId (itemId)
	) character set utf8mb4 collate utf8mb4_unicode_ci;
```

To add the per-user activity counters (`ctHits`, `ctHitsToday`, `whenLastHit`) to an existing `users` table:

```sql
alter table users add column ctHits int not null default 0, add column ctHitsToday int not null default 0, add column whenLastHit datetime;
```

## An AI can do this install

These instructions work for people, and they work for AIs. If you use Claude Code or a similar agent, give it shell access on the machine that will run the server, point it at this document, and tell it to do the install. It can set up Node and MySQL, create the database from the schema above, fill in config.json, and start the server -- checking with you only on the questions that are genuinely yours to answer: your domain name, your database name, your AWS credentials.

The instructions above read the same either way. Follow them yourself, or read along while your AI does.

Written by Claude Code.

&nbsp;

&nbsp;

