# Howto use a Mailer

Even if OpenPaaS provides a Web interface to access to the user mailboxes, you can use a standard mail client.
The current document gives instructions on how to configure Mozilla Thunderbird (tested with v38.5.1)

This assumes that your OpenPaaS platform is running, if not, check instructions on [run.md](./run.md).

**Add an account**

Go to Tools > Account Settings, Account Actions > Add Mail Account.

- Email Address: admin@open-paas.org
- Password: james

Click on 'Continue' then on 'Manual Config' and adapt the settings:

![Create Account][mailer-01]

![Maunal Config][mailer-02]

- Server hostname: <YOUR_DOCKER_IP> for both imap and smtp.
- IMAP Port: 1143
- SMTP Port: 1025

Keep everything else as-is and click on 'Re-test'. Your James instance should return configuration for SSL and Authentication fields. Then click 'Done'.

![Re-test][mailer-03]

![Done][mailer-04]

[mailer-01]: ./assets/mailer-01.png
[mailer-02]: ./assets/mailer-02.png
[mailer-03]: ./assets/mailer-03.png
[mailer-04]: ./assets/mailer-04.png
