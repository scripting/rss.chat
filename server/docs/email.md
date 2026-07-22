# How the server sends email

Sign-in on an rss.chat server is a magic link: the user enters their email address, the server mails them a link, they click it and they're in. There are no passwords. That means your server must be able to send email before anyone -- including you -- can sign in. It's the one piece of the install that depends on something outside the server itself.

There are two ways to send, and one config setting decides between them: if `smtpHost` is present in config.json the server sends through SMTP, otherwise it uses Amazon SES.

## Sending through SMTP

This is the simplest path if you already have an email provider -- most give you SMTP credentials, and services like [Fastmail](https://www.fastmail.com/), [Mailgun](https://www.mailgun.com/), and [SendGrid](https://sendgrid.com/) all work. Add four values at the top level of config.json (not inside the `database` section):

```json
"smtpHost": "smtp.yourprovider.com",
"smtpPort": 587,
"smtpUsername": "you@yourdomain.com",
"smtpPassword": "your-smtp-password",
```

Your provider's docs list the host and port; the username and password are the credentials they gave you. As with any password, keep this config.json out of public repos.

## Sending through Amazon SES

If `smtpHost` is absent, the server sends through [Amazon SES](https://aws.amazon.com/ses/). Nothing goes in config.json for this, but the machine needs AWS credentials (the standard `~/.aws/credentials` file), and your sending address must be verified with SES. Scott Hanson wrote up the whole process for FeedLand, and it applies here unchanged: [How to setup SES](https://github.com/scripting/feedlandInstall/blob/main/docs/setupses.md).

One wall to know about before you hit it: the From address must be at a domain you control and have verified with SES. You can't send from a gmail.com address or any other domain you don't own.

## The email itself

Three settings in config.json shape the confirmation email -- the From address, the subject, and the phrase describing what's being confirmed. They're covered in [config.md](config.md) under Email sign-in. Make sure `mailSender` matches how you're sending: for SMTP it should be an address your provider lets you send from, for SES an address at your verified domain.

Written by Claude Code.

&nbsp;

&nbsp;
