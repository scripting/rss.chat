# How to install a rssNetwork server

Instructions for a new host-runner.

## Edit config.json

A `config.json` file in the project root holds the settings you'll want to customize for your installation. The repo includes an example with the common knobs (port, database connection, S3 credentials, FeedLand server URLs, base feed URL).

## Create your database

The server uses MySQL. Paste the following at a `mysql>` prompt. Change `myRssNetwork` to whatever name you want, and update `config.json` to match.

```sql
create database myRssNetwork character set utf8mb4 collate utf8mb4_unicode_ci;

use myRssNetwork;

create table users (
	screenname varchar (255) not null,
	emailAddress varchar (255),
	emailSecret varchar (64),
	prefs json,
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
```

### Notes on the schema

**users** -- one row per signed-in user. `screenname` is the primary key; `emailAddress` is indexed because the magic-link flow looks users up by email. `emailSecret` holds the rotating confirmation code.

**items** -- one row per posted item. Mirrors FeedLand's items table where the columns overlap, so anyone familiar with FeedLand will recognize the shape.

- `feedUrl` is the partition key for items, indexed.
- `author` is the poster's screenname, indexed because the item-read queries join `users` on it.
- `inReplyTo` is the `id` of the item this one replies to, for threading.
- `description` is the HTML the client sent; `markdowntext` is the markdown derived from it via turndown. The feed emits both.
- `outlineJsontext` is reserved for outline-typed posts (richer post types per the textcasting spec).
- `title`, `link`, and the `enclosure*` columns are optional -- most chat-style posts have only `description`.
- `flDeleted` marks a soft-deleted item. A delete sets the flag rather than removing the row, so reply threads stay intact; the item-reading queries filter it out. Matches FeedLand's `flDeleted`.
- `whenCreated` and `whenUpdated` auto-populate via the schema defaults.
