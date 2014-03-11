# Configuration

The configuration of the ESN is stored in MongoDB under the configuration collection in order to be distributed over nodes.

## Mail

    {
      "_id": mail,
      "mail": {
        "noreply": "noreply@hiveety.io"
      },
      "transport": {
        "module": "nodemailer-browser",
        "type": "MailBrowser",
        "config": {
          "dir": "/tmp",
          "browser": true
        }
      }
    }

### Mail

The *mail* section contains the list of useful emails of the platform.

### Transport

The *transport* section is used to configure the mail transport ie what to use to effectively send the mail to the mail provider.
nodemailer is used to send emails, the config section follows the same format.

- module: You can specifiy a npm module to be used as transport
- type: The type of transport
- config: The transport configuration

## Session

The ESN session attributes can be configured like:

    {
      "_id": "session",
      "remember": 2592000000,
      "secret": "This is the super secret secret"
    }

- remember: The persistent cookie lifetime
- secret: The secret used to crypt cookies
