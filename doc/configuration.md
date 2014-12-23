# Local Configuration

Local configuration of the application is available in the ./config/default.json file.

## Authentication

    "auth": {
      "strategies": ["local", "mongo", "bearer"]
    }

Array containing the authentication strategies to be loaded by the application. The application will go through all the authentication strategies until a valid one is found for the current HTTP request.
Possible values are:

- local: Local configuration is defined in ./config/users.json file.
- mongo: Uses the User collection in mongodb.
- ldap: Connect to a LDAP server defined in the global configuration parameter (cf below)
- bearer: OAuth2 authentication mechanism (cf [REST API](REST.md) for more details)

# Global Configuration

The configuration of the ESN is stored in MongoDB under the configuration collection in order to be distributed over nodes.

## Mail

    {
      "_id": mail,
      "mail": {
        "noreply": "noreply@openpaas.io",
        "reply": {
          "domain": "openpaas.io",
          "name": "OpenPaaS Bot"
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

## Redis

Defines the Redis configuration using the standard Redis options defined in the [redis node client](https://github.com/mranney/node_redis#rediscreateclientport-host-options):

    {
      "_id": "redis",
      "host": "localhost",
      "port": 6379
    }

## CalDAV

Defines the CalDAV server configuration:

    {
      "_id": "caldav",
      "backend": {
        "url": "http://localhost:80"
      },
      "frontend": {
        "url": "http://localhost:80"
      }
    }

- backend.url: URL use by the ESN to send request to the CalDAV server
- frontend.url: URL use by the browser (client) to send request to the CalDAV server

## Web

Defines the general Web settings for the ESN deployment.

    {
      "_id": "web",
      "proxy": {
        "trust": true
      },
      "base_url": "http://localhost"
    }

- proxy: Activate or not the expressjs 'trust proxy' flag (application.enable('trust proxy')).
- base_url: Defines the baseURL of the application. This parameter is optional and is used to define the public URL of the application.

***base_url* may be used when the ESN is deployed behind a proxy/load balancer. This setting helps to build several URLs in the application.