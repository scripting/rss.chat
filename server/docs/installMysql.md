# Running an RSS.chat server on MySQL

The standard install ([install.md](install.md)) uses SQLite: the database is one file the server creates for itself, and there's nothing to set up. That's the right choice for almost everyone. But the server ran on MySQL for its whole first act, every part of it still works there, and if you're planning something big -- or you already have MySQL running and like it -- this page is the MySQL side of the story: the config, the schema, and the upgrade notes.

## How to set up a server on MySQL

Follow the steps in [install.md](install.md), with two differences:

1. In config.json's `database` section, leave out `"flUseSqlite"` (or set it to `false`) and provide the MySQL connection instead. `database` is the schema name you'll create in the next step. Keep `charset` at `utf8mb4` to match the schema.

```json
"database": {
	"host": "your-cluster.db.ondigitalocean.com",
	"port": 25060,
	"user": "doadmin",
	"password": "your-db-password",
	"charset": "utf8mb4",
	"connectionLimit": 100,
	"database": "myRssChat",
	"debug": false
	}
```

Never commit a real password. Keep `config.json` out of any public repo.

2. Before starting the server, create your database -- paste the SQL from the next section at a `mysql>` prompt.

## Create your database

Paste the following at a `mysql>` prompt. Change `myRssChat` to whatever name you want, and update `config.json` to match.

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

create table files (
	path varchar (512) not null,
	type varchar (64),
	filecontents longtext,
	whenCreated datetime default current_timestamp,
	whenUpdated datetime default current_timestamp on update current_timestamp,
	ctSaves int unsigned not null default 1,
	primary key (path)
	) character set utf8mb4 collate utf8mb4_unicode_ci;

create table media (
	id int unsigned not null auto_increment,
	screenname varchar (255),
	type varchar (64),
	mediabytes mediumblob,
	size int unsigned,
	whenCreated datetime default current_timestamp,
	primary key (id)
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

**files** -- the feeds and the subscription list, when `flFeedsInDatabase` is on. One row per file: `path` is the request path the file is served at (`/users/dave/rss.xml`), `filecontents` is the file, `type` is its content type, and `ctSaves` counts how many times it's been rebuilt. Paths are stored lowercase, so feed URLs are case-insensitive. If you serve feeds from S3 instead, this table simply stays empty.

**media** -- images pasted into posts, and in the future other binary media. One row per upload: `id` is the address the item is served at (`/media/123`), `mediabytes` is the file itself, `type` is its content type, `screenname` is who uploaded it, and `size` is the byte count. The per-upload limit is `maxMediaUploadBytes` in config.json, 2MB by default; `mediumblob` holds up to 16MB, so there's room to raise it.

## Upgrading an existing database

The block above is for a fresh install. If you already have a running server from an earlier version, add the new tables on their own.

The `files` table, for serving feeds from the database:

```sql
create table files (
	path varchar (512) not null,
	type varchar (64),
	filecontents longtext,
	whenCreated datetime default current_timestamp,
	whenUpdated datetime default current_timestamp on update current_timestamp,
	ctSaves int unsigned not null default 1,
	primary key (path)
	) character set utf8mb4 collate utf8mb4_unicode_ci;
```

Then add `"flFeedsInDatabase": true` to your config.json, remove the four feed-location settings (`rssS3Path`, `rssFeedUrl`, `opmlS3Path`, `opmlListUrl`), and restart. The server rebuilds every feed into the database at startup, so the files are all there before the first request. Anyone subscribed to your feeds at the old S3 addresses will need a redirect from the old location to the new one -- a single permanent-redirect rule on the old feed domain, pointing each path at the same path on your server, moves every subscriber over.

**One more step, and your feeds will be empty without it.** Each post remembers the address of the feed it belongs to, in the `feedUrl` column of the `items` table, and feeds are built by matching on that address. When you switch to database mode your feed addresses change -- they were wherever `rssFeedUrl` pointed, now they're `https://yourdomain.com/users/` -- so posts saved before the switch no longer match, and every rebuilt feed comes up empty. The fix is one SQL statement that rewrites the old base address to the new one:

```sql
update items set feedUrl = replace (feedUrl, 'https://old.feed.domain/', 'https://yourdomain.com/users/');
```

Put your old `rssFeedUrl` value in the first string and your server's address plus `/users/` in the second, run it, then restart the server so the feeds rebuild. When we upgraded rss.chat this was the step we missed the first time -- a user's feed was empty until we found it.

The `likes` table:

```sql
create table likes (
	screenname varchar (255),
	itemId int unsigned,
	whenCreated datetime default current_timestamp,
	primary key (screenname, itemId),
	index itemId (itemId)
	) character set utf8mb4 collate utf8mb4_unicode_ci;
```

The `media` table, for images in posts:

```sql
create table media (
	id int unsigned not null auto_increment,
	screenname varchar (255),
	type varchar (64),
	mediabytes mediumblob,
	size int unsigned,
	whenCreated datetime default current_timestamp,
	primary key (id)
	) character set utf8mb4 collate utf8mb4_unicode_ci;
```

To add the per-user activity counters (`ctHits`, `ctHitsToday`, `whenLastHit`) to an existing `users` table:

```sql
alter table users add column ctHits int not null default 0, add column ctHitsToday int not null default 0, add column whenLastHit datetime;
```

## Moving to SQLite

Whenever you're ready, the migration is six steps and about five minutes -- see "Coming from a MySQL install" in [install.md](install.md). Your MySQL database is never written to by the migration, so the road back is just flipping the flag off.

Written by Claude Code.

&nbsp;

&nbsp;
