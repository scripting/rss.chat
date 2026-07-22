#### 7/21/26; 12:00 PM ET by CC

**The Software versions dialog now tells you which database engine the server runs on.** Servers can now run on SQLite as well as MySQL (that's the day's big server-side story -- see the server worknotes), and the dialog's last line follows along: it says "SQLite version" or "MySQL version" to match the actual engine, with the real version number either way. The server sends the engine name in a new `databaseEngine` member of the user-data record, and the client reads it as of v0.6.10. First seen live on scratchpad.rss.chat, the first server running on SQLite.

#### 7/20/26; 5:15 PM ET by CC

**The reply editor got out of your way.** When you reply to a post, the editor used to lead with the post itself — the first few lines, taking up room, an eyesore you'd already read. Now it shows the author's avatar and name, and under the name one quiet line: a wedge and "46 words." Click the wedge and the whole post unfolds, click again and it tucks back away. It starts folded every time, because when you're writing a reply, that's really all you need — who you're answering and how much they said, one click from the full text. (Theme v0.5.331–0.5.337.)

#### 7/19/26; 1:00 PM ET by CC

**Software versions, in one place.** Don Park asked for the version number in a tooltip, for telling a stale cached client from a current one. It went in a different door: the first command in the system menu, formerly About RSS.chat, is now **Software versions** — one dialog with the server address and the versions of everything: server, client, theme, and MySQL. The theme version number that used to sit in the menu bar during rapid UI development is gone — it had one job, confirming you were running the latest theme, and the dialog now covers all of it. Work by DW; his reply to Don is [353](https://rss.chat/?id=353).

#### 7/19/26; 10:15 AM ET by CC

**The goodnight dialog no longer leaves a dead app behind.** When a fresh copy of the app signs on, the older copy puts up a dialog and stops listening — that's the goodnight kiss, from two days ago. But if you dismissed that dialog by clicking outside it instead of clicking OK, the dialog went away and the app just sat there, disconnected. Now the page reloads no matter how the dialog is dismissed — OK, a click outside, or the Escape key all land you in the same place: a fresh copy of the app. (Client v0.6.8.)

#### 7/18/26; 2:30 PM ET by CC

**The browser tab now shows your server's name.** The home page's title was hard-coded to "rss.chat" — every instance, whatever its name, said rss.chat in the tab. Now the title comes from the server's `productNameForDisplay` setting, so demo.rss.chat says demo.rss.chat, and your instance says whatever you named it. Work by DW.

#### 7/17/26; 12:15 PM ET by CC

**Only one copy of the app runs at a time now — the goodnight kiss.** If you're signed in and open the app in a second tab, or another browser, or another machine, the older copy puts up a friendly dialog: the app is running in another tab, click OK to reload this one, or close it, no work lost. This fixes a bug that bit quietly and repeatedly: a change you made in one place — say, the URL of your icon in settings — could be silently wiped when an older copy, still running with the old settings, saved over it. Now a stale copy stands down the moment a fresh one signs on, so your latest settings always win. When the app connects, it identifies you to the server, and the server sends a "goodnight" message to every other connection you have open — the name comes from that message. (Client v0.6.7.)

#### 7/16/26; 6:00 PM ET by CC

**A person's name now takes you to their posts.** Clicking a name anywhere in the timeline used to open that person's website in a new tab — surprising when what you wanted was to see what they've been posting. Now the name does what the avatar does: it shows their timeline, right in the app. Their website isn't lost — it's linked from their profile page. This came out of real use: Dave clicked a name expecting the person's posts and landed on their homepage instead. (Theme v0.5.330.)

#### 7/16/26; 11:30 AM ET by CC

**A feed icon on every post.** Each post's header now ends with a small feed symbol, right after the time: name · time · feed. Click it and the author's feed opens — a real RSS 2.0 feed you can hand to any feed reader, no account needed, nothing to wait for. Hover it and the tooltip says whose feed it is, using the server's own display name — on rss.chat, "Dave Winer's rss.chat feed." The icon is deliberately quiet: the same gray as the time next to it, not the traditional orange, because it belongs on every post without shouting from every post. Now each post is visibly connected to the author's feed — which is the whole idea of the product, worn on its sleeve. Dave wrote it up on Scripting News: [A feed icon on every post](http://scripting.com/2026/07/16/134247.html). (Theme v0.5.323–0.5.328.)

**The Docs menu keeps growing.** A new sub-menu links the docs for RSS and OPML — the two formats the product is built on, now a click away from the timeline. Later the same day: a Blog posts sub-menu, collecting the story so far — from "Can RSS be a social network?" through today's feed icon.

**Tooltips moved home too.** The hover tips on the left-panel icons — Home, New post, Feed, Data — used to appear off to the right, floating over the timeline, pointing at nothing in particular. They now appear directly below the icon and its word. (Theme v0.5.329.)

#### 7/14/26; 8:30 PM ET by CC

**You can select text in the timeline now.** Until today the text of a post couldn't be selected — to copy a phrase from your own post you had to open the editor, and for someone else's post there was no way at all. Now post text selects like any text on any page: drag across it, copy it, quote it. The one wrinkle worth solving: clicking a long post is how you expand and collapse it, and a drag-select ends with a click — so the click that finishes a selection is ignored, and plain clicks still open and close the post the way they always have. (Theme v0.5.322.)

#### 7/13/26; 10:15 AM ET by CC

**Links show up the moment you save them.** The server now turns bare URLs into links when a post saves (the story is in the [server worknotes](https://github.com/scripting/rss.chat/blob/main/server/code/worknotes.md)), and the client keeps up: when you update a post, the copy in the timeline repaints from what the server actually saved, so the new links are clickable immediately — no reload needed. (Theme v0.5.321.)

#### 7/11/26; 7:45 PM ET by CC

**Home does it all now, and Surface is retired.** Surface — the icon that pulled you out of a deep conversation back to your place in the timeline — lived less than two days, but it proved the idea. Now that lifeline is Home's first stage: when you're buried in a story, a profile, a flipped view, or an open conversation, clicking Home brings you back to the timeline with the cursor still on the post you were reading. Click it again and you're at the top, everything reset, cursor on the newest post. It's the same rhythm as the Home tab in the Twitter and Instagram apps — tap once to come back, tap again for the top — with one icon fewer to remember. (Theme v0.5.318–0.5.320, including a fix for a sneaky side effect: the icon panel used to shift a hair when the page scrolled, which could put a different icon under your mouse between the first click and the second.)

**Sign-in emails reach the inbox now.** rss.chat's confirmation emails had been landing in spam. The app now sends from hello@rss.chat, and the domain is verified with Amazon SES, so Gmail and the rest can see the mail is really from us. The full story is in the [server worknotes](https://github.com/scripting/rss.chat/blob/main/server/docs/worknotes.md).

#### 7/11/26; 12:50 PM ET by CC

**The repo has its real shape now.** [github.com/scripting/rss.chat](https://github.com/scripting/rss.chat) is organized the way the product is: a client folder and a server folder, each with its own code and docs, and a new top-level [examples](https://github.com/scripting/rss.chat/tree/main/examples) folder for complete apps built on the APIs. The first example is *threadwalker*, a small Node app that walks a whole conversation using nothing but the RSS feeds — no API calls, no account — and prints it as an indented outline.

These docs moved too. The basics doc is now the readme of [client/docs](https://github.com/scripting/rss.chat/tree/main/client/docs), so it's the first thing you see when you browse the folder, and the firehose documentation is a section inside it — one document, because the whole site is for developers.

#### 7/10/26; 5:07 PM by CC

**A post never shows twice.** Opening a conversation with the wedge had a flaw: a reply might already be sitting in the timeline as its own post, so expanding its parent put the same words on screen twice. Now, when replies open under a post, any of them that were standing in the timeline fold into the conversation — every post appears exactly once. Close the wedge and they return to their places. If your cursor was on one of those posts, it follows it into the conversation. (Theme v0.5.316.)

**Home is the way out.** Dave opened a conversation, read it, and then couldn't see how to get back — the wedge that opens a thread goes light once it's open, and light means "nothing to see here." His instinct was the Home button, and it was disabled. That instinct is now the design: whenever a conversation is open in the timeline, Home lights up, and clicking it closes everything and returns you to the top — the same fresh timeline Home has always meant. (Theme v0.5.317.)

**The signup help text tells the truth.** Don Park signed up — welcome! — and reported that the account-name help text said "Name must be 4 chars." when longer names clearly work. The check was always a minimum; the words now say so: "Name must be at least 4 chars." Dave applied the fix. The report also surfaced something the help text was covering for: nothing actually stops a too-short name from going through. That enforcement is on the todo list.

**The left-panel labels are real now.** The icon labels added yesterday were the theme's guesses, mapped from icon names. Dave gave each icon a title of its own in the app's data, and the theme now displays exactly those — theme designers get the app's words, not their own inventions. Also new since this morning: the Home button knows when you're already home, and disables itself. (Theme v0.5.315.)

#### 7/10/26; 12:48 PM by CC

**Surface.** A new icon in the left panel, and the missing half of yesterday's wedge. The wedge takes you down into a conversation; Surface brings you back up. Wherever you've gotten to — a story page, a profile, the flipped view — one click returns you to the timeline with the cursor on the post you were just reading, scrolled into view. It's not Home: Home takes you to the top and starts fresh, Surface puts you back exactly where you left off. Dave's reaction on first click: it's a lifeline, for when you're buried in something and just want out. Announced on rss.chat in [post 216](https://rss.chat/?id=216) — written by Claude, reviewed word for word by Dave before it posted, which is the standing rule for anything published from the claude account. (Theme v0.5.312.)

**A link to a reply now shows the reply.** Clicking a post's timestamp used to do something surprising when the post was a reply: instead of the post you asked for, you got its parent's page with your post nested inside it. Now every post's link shows that post as its own page, with its replies below — and "Replying to" at the top is the way up to the parent, one step at a time. This came directly out of real use: Dave wanted to link to a particular reply from a blog post, clicked its timestamp, and landed somewhere confusing. With the wedge to go down and Surface to come back up, the post itself is the right place to land. (Theme v0.5.313–314.)

**Tooltips came home.** The hover tips on the left-panel icons were appearing far off to the right, floating in empty space. The panel was much wider than its labels needed, and the tips hang off the panel's far edge. The panel now fits its contents: the tips appear right beside the icons, and the whole icon column sits closer to the timeline.

#### 7/9/26; 6:16 PM by CC

**The wedge.** Every post now carries a small wedge just left of its comment icon, and it answers a question the timeline never could: is there more underneath? A dark wedge means the post has replies you aren't seeing — click it and they open right there, nested under the post, with everything else on screen staying put. Click again and they fold away. Each opened reply has its own wedge, so a deep conversation unfolds level by level, as far down as you care to go. A light wedge means don't bother clicking — nothing hidden. No spinning, no pointing down when open: the shade is the whole signal, an idea borrowed from outliners going back to Frontier, where it's worked without complaint for decades. If you've used Drummer, or the blogroll on scripting.com, your eye already knows how to read it.

**The left column grew up.** The icons on the left — Home, New post, Feed, Flip, Data — now show their names next to them, in the style of the sidebars in Claude and ChatGPT. Same icons, same behavior, much easier to learn. (Theme v0.5.311.)

**The like count that said -1.** A heart under a post briefly showed a like count of minus one — the server always had the right number, but the copy on screen was doing arithmetic on stale information. The cause: a post can be on screen in more than one place at once (the timeline, its own story page), and when likes changed, only one of those copies got the news. Now every visible copy of a post updates together, and the count on screen can never go below zero. (Theme v0.5.307.)

#### 7/7/26; 1:55 PM by CC

**Posts that wouldn't open, fixed.** Sometimes clicking a long post to expand it did nothing — most often on posts with images. The app was deciding whether a post needed a "click to expand" before its images had finished loading, and once it decided no, the decision was permanent. Now it decides at the moment you click, so a clipped post always opens.

**Deleted posts now say so.** Following a link to a deleted post used to show the post as if nothing had happened — deleted things shouldn't linger. Now the page says plainly: *Can't view the post because it has been deleted.* You'll also land there if you click "Replying to" under a reply whose parent was deleted — an honest answer instead of a dead end.

**The theme's name and version now live in the upper right** — currently "Classic v0.5.306" — and clicking it opens the About dialog with all the version numbers. Also, theme updates now reach your browser as soon as they ship; previously your browser could quietly hold onto an old copy for a while.

**Headings and code get the same care quotes got.** After the quote work landed, we audited every kind of HTML a post can contain, looking for others still wearing framework defaults. Two more needed attention. Headings now have real hierarchy — a big heading is bigger than a small one, and both stand apart from bolded body text; until now h1 through h4 all rendered identically. And code finally reads as code: inline code and code blocks render in a small monospaced face, borrowed directly from WordLand's stylesheet — which, it turns out, has quietly held the answer to most of this week's questions. To see everything in one place, there's a demo post: [The full palette](https://rss.chat/?id=197).

#### 7/6/26; 12:28:33 PM by CC

**Quoted text finally looks right.** Blockquotes used to render in Bootstrap's default dress — oversized, oddly spaced, a thick gray bar. Now a quote reads in exactly the same type as the rest of the post, set off by a thin rule with real breathing room, the text slightly muted to say "these are someone else's words." We tried three looks live before landing on this one, and the final recipe came out of a collaboration: Dave took the question to a second Claude conversation for an independent opinion, brought back its design, and we shipped it verbatim. It also fixed something subtle we'd missed — Bootstrap styles the paragraphs *inside* a quote separately, in a lighter weight, which is why quotes never quite matched no matter what the quote block itself was told to do.

**Replies with titles, and long markdown posts, verified.** The two fixes from this morning's notes were tested in the live app — a reply's title arrives intact, and a long post in Markdown mode scrolls inside its box with the buttons in view.

#### 7/6/26; 10:03:07 AM by CC

A big day for writers — the editor was rebuilt underneath, and a batch of everyday annoyances got fixed.

**The editor now keeps your text as Markdown, permanently.** Until now the editor had one writing surface that converted its contents in place every time you switched between the wizzy view and Markdown mode — and every conversion was a chance to lose something. Text inside angle brackets could vanish, adjacent lists could tangle together, and each additional flip made things worse. Now it works the way WordLand's editor always has: your Markdown text is the real document, Markdown mode is a plain text box editing exactly that text, and the wizzy view is a rendering of it. Flip between them as much as you like — flipping alone never changes a character. Dave wrote about the change [here](https://rss.chat/?id=190). Two things you'll notice: in Markdown mode, Enter types a plain line break now, like any text box, and a long post scrolls inside the box instead of pushing the buttons off the screen. And the power move that used to fail — dropping into Markdown mode to add something special, like an `<img>` tag — works now.

**Replies can carry titles.** Adding a title to a reply used to look like it worked, but the title was silently dropped when you published. Now it goes through, same as on a regular post.

**Titles show bold while you write them.** That's how titles look.

**Deleting a post takes you home.** Deleting from a post's own page used to leave the dead post on your screen. Now you land back on the home timeline and it's gone.

**The editor stays put while you select text.** Selecting with a swipe that drifted past the editor's edge used to make the whole editor vanish — very jarring. It doesn't anymore; only a deliberate click outside dismisses it.

**Long posts don't jump when you like them.** Clicking the heart (or finishing an edit) on a long, collapsed post used to snap it fully open, throwing the icons far down the screen. A post now keeps its collapsed state when it updates.

**Delete is only offered on your own posts.** The Delete command in a post's popup menu is now disabled on everyone else's.

#### 7/5/26 by CC

First entry in these worknotes. From here on, when something changes in rss.chat, this is where we tell you about it — what changed, and how to use it. Newest notes at the top.

The [rss.chat repo](https://github.com/scripting/rss.chat) went public today. It contains the full source of the client — how it calls the API, its side of the firehose socket, and the themes. Questions are welcome in the [Issues section](https://github.com/scripting/rss.chat/issues).

If you're signed out, the icons that need an account — compose, your feed, your data — are now disabled instead of silently doing nothing or leading you somewhere broken. The flip between timeline views still works signed out, because reading doesn't require an account. (App version 0.6.4.)

In the RSS feeds we generate, a reply now points at its parent post's real permalink. See the rss.network worknotes for the story.
