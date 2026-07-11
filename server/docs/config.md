# About config.json

`config.json` holds the values you provide to run an rss.chat server. It lives in the app's folder (e.g. `pagepark/domains/rss.chat/config.json`) and is read once at startup. daveappserver reads the same file and fills in operational defaults for anything you leave out, so you only need the fields below.

The required fields come first. The optional ones (websockets, access control, the human-readable note) follow.

## Identity

### productName

The internal name of the product. Used in logging and as the app's identity, not shown to users.

`"productName": "rssChat"`

### productNameForDisplay

The name users see in the UI (the title at the top of the page, for example).

`"productNameForDisplay": "rss.chat"`

## URLs

### myDomain

The domain the server runs under, no scheme. In production it's your real domain; on a dev box it's `localhost` plus the port.

`"myDomain": "rss.chat"`

### urlServerForClient

The base URL the browser uses to reach the server. Item permalinks (guids) are derived from this value, so changing it changes the guids of future posts.

`"urlServerForClient": "https://rss.chat/"`

### urlServerForEmail

The base URL used to build the magic links in confirmation emails. Normally the same as `urlServerForClient`.

`"urlServerForEmail": "https://rss.chat/"`

### urlServerHomePageSource

The URL the server pulls the client's home page HTML from. Every installation currently pulls from the same place on scripting.com.

`"urlServerHomePageSource": "http://scripting.com/code/rsschat/index.html"`

## Database

### database

The MySQL connection. `database` is the schema name you created at install time (see [install.md](install.md)). Keep `charset` at `utf8mb4` to match the schema.

```json
"database": {
	"host": "your-cluster.db.ondigitalocean.com",
	"port": 25060,
	"user": "doadmin",
	"password": "your-db-password",
	"charset": "utf8mb4",
	"connectionLimit": 100,
	"database": "rsschat",
	"debug": false
	}
```

Never commit a real password. Keep `config.json` out of any public repo.

## Email sign-in

Sign-in is a magic link: the user enters an email, the server mails a confirmation link. These three fields shape that email.

### mailSender

The From address on confirmation emails.

`"mailSender": "dave.winer@gmail.com"`

### confirmEmailSubject

The subject line of the confirmation email.

`"confirmEmailSubject": "rss.chat confirmation"`

### operationToConfirm

The phrase used in the body of the confirmation email to describe what the user is confirming.

`"operationToConfirm": "sign in to rss.chat"`

## Storage paths

### prefsPath

Filename where the server stores its prefs.

`"prefsPath": "prefs.json"`

### dataPath

Folder where the server keeps its data files.

`"dataPath": "data/"`

## WebSockets (live updates)

Live updates (a new post appearing in the timeline without a reload) run over a websocket. These four fields configure it. Leave `flWebsocketEnabled` false on a dev box that has no TLS/proxy in front of it.

### flWebsocketEnabled

Turns live updates on or off. Default: `false`.

`"flWebsocketEnabled": true`

### websocketPort

The port the app's websocket server listens on. Your reverse proxy (Caddy) routes `wss://` upgrade requests to this port.

`"websocketPort": 1462`

### flSecureWebsocket

Whether the client connects over secure websockets (`wss://`). True in production where TLS is terminated by the proxy. Default: `false`.

`"flSecureWebsocket": true`

### urlWebsocketServerForClient

The websocket URL the client opens. Empty string when websockets are off.

`"urlWebsocketServerForClient": "wss://rss.chat/"`

## Access control

### whitelist

An array of email addresses allowed to sign in. Use this during an invite-only phase to limit who can create an account.

```json
"whitelist": [
	"dave.winer@gmail.com",
	"someone@example.com"
	]
```

## Misc

### note

A free-text comment for whoever reads the file. Not used by the app. The convention is to say which install this is and where it runs.

`"note": "This is the configuration file for rss.chat running on africa."`

## Example file

A ready-to-edit example config, with invented values and a placeholder password, is the [config.json](../config.json) at the top level of this repo. Copy it to your app folder as `config.json` and replace the values with your own.
