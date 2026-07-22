# How to install an RSS.chat server

## How to set up a server

1. [Download the repo](https://github.com/scripting/rss.chat/archive/refs/heads/main.zip) and unzip it.
2. Throw away everything but the *code* sub-folder of the server folder.
3. Inside the code folder, these are the files you need: config.json, emailtemplate.html, package.json, rssnetwork.js. You can remove the rest.
4. Put the code folder wherever you want the server to run, on the machine that will run it.
5. Open config.json in a text editor and replace the example values with your own. Every setting is explained in [config.md](config.md).
	- The example config sets `"flUseSqlite": true` in the `database` section. That's the whole database setup. There is no database server to install, no accounts, no passwords -- the database is a single file the server creates for itself the first time it runs.
	- The example config also sets `"flFeedsInDatabase": true`, which means the server stores its feeds in the database and serves them itself, from your own domain. (The alternative, publishing feeds to Amazon S3, is covered in [config.md](config.md).)
6. Set up email sending -- sign-in is a magic link the server emails to the user, so nobody can sign in until this works. [email.md](email.md) explains the two ways: SMTP credentials from an email provider you already use, or Amazon SES.
7. In the code folder, run `npm install`.
8. Start the server: `node rssnetwork.js`.
	- The first time it starts, the server creates its database at `data/data.db` and sets up all its tables. You'll see it in the folder after the first run. That file *is* your database.
	- The server listens on port 1420. If you're putting a reverse proxy like Caddy or nginx in front of it, that's the port to point it at. To use a different port, set `"port"` in config.json or the PORT environment variable.
	- Websocket connections use their own port, 1422. If your setup uses websockets (live updates in the browser), your proxy needs to forward websocket upgrade requests there. To change it, set `"websocketPort"` in config.json.

That's the whole install. If you've set up an earlier version of this server, notice what's missing: the part where you install MySQL, create a database at the `mysql>` prompt, and paste in a page of SQL. The server now carries its own schema and runs it at every startup -- it only does anything the first time, or when a new table arrives in an update.

## Backups

Because the database is one file, you can back it up by copying `data/data.db` while the server is stopped. But there's a better way, and it works while the server is running:

```
node rssnetwork.js export backup.json
```

That writes every user, post, like, and served file to backup.json, reports the counts, and exits -- it never starts the web server, and it doesn't disturb the one that's running. To load a backup into a fresh server:

```
node rssnetwork.js import backup.json
```

Post ids survive the round trip, so permalinks keep working.

## Coming from a MySQL install

If you're running an earlier version of this server on MySQL, the export and import verbs are also the migration path:

1. Update to the current rssnetwork.js and davesql, and restart. Nothing changes -- the server keeps running on MySQL until you say otherwise.
2. Run `npm install better-sqlite3` in the server folder. If your Node is older than 22, ask for the last major that supports it: `npm install better-sqlite3@11`.
3. Export: `node rssnetwork.js export backup.json`.
4. Add `"flUseSqlite": true` to the `database` section of config.json. Your MySQL settings can stay where they are; they're ignored while the flag is on.
5. Import: `node rssnetwork.js import backup.json`. The counts it reports should match the export's.
	- Import only adds rows, so it expects an empty database. If it stops with a `UNIQUE constraint` error, the server restarted on the new empty database before the import ran and someone touched it -- delete `data/data.db` and run the import again.
6. Restart the server.

Your MySQL database is never written to by any of this, so if anything looks wrong, set the flag back to false and restart -- you're exactly where you started. We moved rss.chat itself this way; the whole thing took about five minutes.

## Still using MySQL

MySQL still works -- every server that runs on it today keeps running, and `"flUseSqlite": false` (or leaving the flag out) keeps a server on it. The MySQL setup, including the full schema, is preserved in [installMysql.md](installMysql.md).

## An AI can do this install

These instructions work for people, and they work for AIs. If you use Claude Code or a similar agent, give it shell access on the machine that will run the server, point it at this document, and tell it to do the install. It can set up Node, fill in config.json, and start the server -- checking with you only on the one question that is genuinely yours to answer: your domain name.

The instructions above read the same either way. Follow them yourself, or read along while your AI does.

Written by Claude Code.

&nbsp;

&nbsp;
