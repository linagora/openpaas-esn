# Configuration

An OpenPaaS instance has two types of configuration:

- Local: Defines the local properties of the instance
- Global: Defines the configuration which is shared between on all the OpenPaaS instances

An OpenPaaS CLI is available to ease the configuration. Check the documentation at [cli.md](./cli.md).

## Local Configuration

Local configuration of the application is stored in the `./config/default.json` file.
You should not modify this file directly but instead define the environment-based
configuration file, e.g. `./config/default.dev.json` for development and
`./config/default.production.json` for production deployment.

The application relies on `NODE_ENV` environment variable to know which
environment-based configuration file to be loaded. For example,
if `NODE_ENV=test`, it will load `./config/default.test.json` file.

*Note that the local configuration defined in `./config/default.json` will not
be overridden by the environment-based configuration file but instead inherited
from it if they are object properties. On the other hand, array properties from
environment-based configuration file will override the default files corresponding
ones.*

### Authentication

Go to [authentication](authentication.md) for more details

## Configuration metadata
Configuration metadata of the application is stored in the `./backend/core/esn-config/constants.js` at key `CONFIG_METADATA`.

A `CONFIG_METADATA` object has the following structure:

```JSON
{
  "moduleName": {
    "rights": {
      "admin": "rw"
    },
    "configurations": {
      "config-1": {
        "rights": {
          "admin": "rw",
          "user": "r"
        }
      },
      "config-2": {},
      "config-3": {}
    }
  }
}
```

With an object defined as above for a module, first we have a generic permission set in `rights` object. This permission rules applies on every configuration defined in `configurations` object. However, if any configuration object has its own permission set like `config-1`, then its declared permission will override the generic one.

Properties of the `rights` object:
- The first is actor, we have two kinds of actor: *admin* and *user*.
- The second is actions allowed on the actor, we have read and write denoted as `r` and `w`.

## Global Configuration

The configuration of the ESN is stored in MongoDB under the `configurations`
collection in order to be distributed over nodes.

A `configurations` document has the following structure:

```JSON
{
  "domain_id" : ObjectId("domain_id"),
  "modules" : [
    {
      "name" : "module name",
      "configurations" : [
        {
          "name" : "config_name",
          "value" : Any
        }, {
          ...
        }
      ]
    }, {
      // other modules
    }
  ]
}
```

By defining `domain_id`, each domain can have its own configuration
(domain-wide configuration).
On the other hand, omitting `domain_id` will make the configuration as system-wide
configuration.

_Note that each domain can have at most 1 domain-wide configuration and the whole
instance can have only 1 system-wide configuration._

### Mail

```
{
  "name": "mail",
  "value": {
    "mail": {
      "noreply": "noreply@open-paas.org",
      "feedback": "feedback@open-paas.org"
      "reply": {
        "domain": "open-paas.org",
        "name": "OpenPaaS Bot"
      }
    },
    "transport": {
      "module": "nodemailer-browser",
      "config": {
        "dir": "/tmp",
        "browser": true
      }
    },
    "resolvers": {
      "whatsup": {
        "active": true,
        "options": {
          "foo": "bar"
        }
      },
      "all": {
        "active": false
      }
    }
  }
}
```

#### Mail

The *mail* section contains the list of useful emails of the platform.

#### Transport

The *transport* section is used to configure the mail transport ie what to use to effectively send the mail to the mail provider.
nodemailer is used to send emails, the config section follows the same format.

- module: You can specify a npm module to be used as transport (if you do not specify module it will use the smtp transport)
- config: The transport configuration forward to the transport module

#### Resolvers

Configure the email messaging resolvers to be used when new messages are added in an activity stream.
For example `{"whatsup": {"active": true}}` will send an email to everybody in the collaboration when a new whatsup is posted.

#### Config example

Basic dev config to save mail in `/tmp` and open it with your default browser.

```
{
  "name": "mail",
  "value": {
    "mail": {
      "feedback": "feedback@open-paas.org",
      "noreply": "noreply@open-paas.org"
    },
    "transport": {
      "module": "nodemailer-browser",
      "config": {
        "dir": "/tmp",
        "browser": true
      }
    }
  }
}
```

Basic smtp configuration. Replace the host config by your smtp server.

```
{
  "name": "mail",
  "value": {
    "mail": {
      "feedback": "feedback@open-paas.org",
      "noreply": "noreply@open-paas.org"
    },
    "transport": {
      "config" : {
        "host" : "smtp.example.com",
        "secure" : false,
        "tls": {
          "rejectUnauthorized": false
        },
        "port" : 25,
        "auth" : {
          "user" : "",
          "pass" : ""
        }
      }
    }
  }
}
```

Basic smtp configuration using Google smtp using a Gmail account.

```
{
  "name": "mail",
  "value": {
    "mail" : {
      "feedback": "feedback@open-paas.org",
      "noreply" : "noreply@open-paas.org"
    },
    "transport" : {
      "config" : {
        "service" : "gmail",
        "auth" : {
          "user" : "",
          "pass" : ""
        }
      }
    }
  }
}
```

### Session

The ESN session attributes can be configured like:

```
{
  "name": "session",
  "value": {
    "remember": 2592000000,
    "secret": "This is the super secret secret"
  }
}
```

- remember: The persistent cookie lifetime
- secret: The secret used to crypt cookies

### Redis

Defines the Redis configuration using the standard Redis options defined in the [redis node client](https://github.com/mranney/node_redis#rediscreateclientport-host-options):

```
{
  "name": "redis",
  "value": {
    "host": "localhost",
    "port": 6379
  }
}
```
### AMQP

Defines the AMQP server url:

```
{
  "name": "amqp",
  "value": {
    "url": "amqp://localhost:5672"
  }
}
```

### Elasticsearch

Defines the Elasticsearch configuration using the standard options defined in [Elasticsearch node client](https://github.com/elastic/elasticsearch-js)

```
{
  "name": "elasticsearch",
  "value": {
    "host": "localhost:9200"
  }
}
```

### CalDAV

Defines the CalDAV server configuration:

```
{
  "name": "davserver",
  "value": {
    "backend": {
      "url": "http://localhost:80"
    },
    "frontend": {
      "url": "http://localhost:80"
    }
  }
}
```

- backend.url: URL use by the ESN to send request to the CalDAV server
- frontend.url: URL use by the browser (client) to send request to the CalDAV server

### LDAP

Defines the LDAP server configurations which can be used for authentication and attendee provider

```
{
  "name" : "ldap",
  "value" : [
    {
      "name" : "Linagora",
      "domainId": ObjectId("5375de4bd684db7f6fbd4f98"),
      "usage": {
        "auth": true,
        "search": false
      },
      "configuration" : {
        "searchFilter" : "(mail={{username}})",
        "searchBase" : "dc=linagora,dc=nodomain",
        "url" : "ldap://localhost:389",
        "adminDn" : "cn=admin,dc=nodomain",
        "adminPassword" : "1234",
        "mapping" : {
          "firstname" : "firstname",
          "email" : "mail",
          "main_phone" : "telephoneNumber"
        }
      }
    }
  ]
}
```

- name: name of the LDAP configuration, usually used to distinguish between
different LDAP configurations.
- The `domainId` is the ID of the domain that the authenticated user will join
after he is provisioned. If `domainId` is omitted, the domain that contains the
configuration will be used. If the configuration is system-wide, the `domainId`
must be present.
- usage: specify the usage of the LDAP configuration. Currently, it can be used
for authentication (`auth`) or search attendee provider (`search`).
- searchFilter: LDAP search filter with which to find a user by username.
- searchBase: The base DN from which to search for users by username.
- url: The address of a LDAP server which to search.
- adminDn: Admin's distinguished Names of LDAP server.
- adminPassword: Password for admin.
- mapping: Mapping Between OP user properties and LDAP user properties.

### Web

Defines the general Web settings for the ESN deployment.

```
{
  "name": "web",
  "value": {
    "base_url": "http://localhost"
  }
}
```

- base_url: Defines the baseURL of the application. This parameter is optional and is used to define the public URL of the application.

**base_url** may be used when the ESN is deployed behind a proxy/load balancer. This setting helps to build several URLs in the application.

### Webserver

Defines the webserver settings for the ESN deployment.

```JSON
{
  "name": "webserver",
  "value": {
    "proxy": {
      "trust": true
    }
  }
}
```

- proxy: Activate or not the ExpressJS 'trust proxy' flag (application.enable('trust proxy')).

### JWT

Defines the algorithm, public-key and private-key that will be used to encode/decode json web tokens in the ESN instances.

```
{
  "name": "jwt",
  "value": {
    "algorithm": "RS256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtlChO/nlVP27MpdkG0Bh\n16XrMRf6M4NeyGa7j5+1UKm42IKUf3lM28oe82MqIIRyvskPc11NuzSor8HmvH8H\nlhDs5DyJtx2qp35AT0zCqfwlaDnlDc/QDlZv1CoRZGpQk1Inyh6SbZwYpxxwh0fi\n+d/4RpE3LBVo8wgOaXPylOlHxsDizfkL8QwXItyakBfMO6jWQRrj7/9WDhGf4Hi+\nGQur1tPGZDl9mvCoRHjFrD5M/yypIPlfMGWFVEvV5jClNMLAQ9bYFuOc7H1fEWw6\nU1LZUUbJW9/CH45YXz82CYqkrfbnQxqRb2iVbVjs/sHopHd1NTiCfUtwvcYJiBVj\nkwIDAQAB\n-----END PUBLIC KEY-----",
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtlChO/nlVP27MpdkG0Bh16XrMRf6M4NeyGa7j5+1UKm42IKU\nf3lM28oe82MqIIRyvskPc11NuzSor8HmvH8HlhDs5DyJtx2qp35AT0zCqfwlaDnl\nDc/QDlZv1CoRZGpQk1Inyh6SbZwYpxxwh0fi+d/4RpE3LBVo8wgOaXPylOlHxsDi\nzfkL8QwXItyakBfMO6jWQRrj7/9WDhGf4Hi+GQur1tPGZDl9mvCoRHjFrD5M/yyp\nIPlfMGWFVEvV5jClNMLAQ9bYFuOc7H1fEWw6U1LZUUbJW9/CH45YXz82CYqkrfbn\nQxqRb2iVbVjs/sHopHd1NTiCfUtwvcYJiBVjkwIDAQABAoIBAAkhTJHGV/fDpSZJ\ncpfyx3OXOYoB22PNBmgezPHKW7goZ7tf/rPLjU/MdXRW2Ps75ssrInzyhTwEzRXQ\nLg/uhKC9RD/B0Fu9PpiYt/vAqlb865qmm5PvfknZhkwntytCL7rQ+HEkysx2br2f\nrPr5XKKK1tIh35NzlwfktWQOjG1sk5vfHc/fyUrWE6KoZgIrW0Rmc8c7YRMwljYT\nUGQAL2LBDGsocFV92AsMCLcCmI/gF0J2g5880htcj+TzsdCHAPviB8Z262mFlmLB\nrPWlUwWLmqdyr9YoLXszZ+iERCglPK8kn14wxcrNWrxLlHU9b2HXRIR9MwlyjLDK\nLc8lgHECgYEA6C3nJfGqmj2Y7fLxZOcTwuP5UvprwbvHaoeU8brPjrt+Wp4MgznG\nIJLtd7twJQhMh4NPQSqZhQxDb+Pa8S5prLH2lvEa9+sNXeh/z5FD0NG1zsNGJ+Am\nB+7xM5LlpinDh+NlCLHiWOg/YcQtqfIvNFwDdt9LGE37dxOpSF9jxIcCgYEAyQUP\nRXECEWYfMd2z7spzJ3hP3o/qPA5WE0EaXMRtLAQg9cnLM7odcT37uFT7joHijPe/\nml7cjJf9oyCZjN8GqGmaHH4MYe5LQVQrwmkMH6Y5pvFta5i9p9SA0h98TEr/rThL\nKRKwz+ItSz6YP7WINBsBdbJNjJxj7su9s8udN5UCgYAdARb+I3l3eThwiUfkngVW\n9FnCJuxtMEMSKMvPgtHI990p/tJ7Vi1NBm3J5k11IttEln/BGUxCVaza/nDsbirf\nWv/+DTKcQ+3QjGnjCTeaj4gRw00xUAwQM6ZIFhLANjlp8Vs+wdIP3zuDwBkgQNPq\ny4/XOr/L0noWfwtHsjrpYwKBgQC8RnblLVEohqOVCvdqIkf0oeT8qYJTuYG5CvLs\nDDXMUhmk29nsmtbUp59KKJ5r/Q75xVm59jtPm1O+I9xtar5LoozrPsvONWhaycEq\nl0T5p7C7wcggTLDlrkzxgPfkZSJPVThgQddE/aw6m2fx0868LscRO20S069ti3ok\nGgMoeQKBgQCnKB+IPX+tnUqkGeaLuZbIHBIAMxgkbv6s6R/Ue7wbGt/tcRXhrc4x\nQDSXlF8GxlJW0Lnmorz/ZRm6ajf1EpajEBh97cj4bnwWFiKe+Vsivkp72wPb9qSl\ninNz0WXJtOTrDLhu55P0mDjArCCYNi69WTq9jTo18v4DI0zzfUUaaQ==\n-----END RSA PRIVATE KEY-----"
  }
}
```

### Home page

Home page is the first page that the user is redirected to after logged in to ESN.
Valid values are ui-router states available in ESN.

```
{
  "name": "homePage",
  "value": "unifiedinbox"
}
```

### Login

Defines login options for ESN instance.

```
{
  "name": "login",
  "value": {
    "failure": {
      "size": 5
    }
  }
}
```

### Locale

Defines the language to be used for internationalization when sending emails.

```
{
  "name" : "locale",
  "value" : "fr"
}
```

### Autoconf

Defines the configuration file template used by the autoconfiguration mechanism. The template will be processed through EJS.

```
{
    "name" : "autoconf",
    "value" : {
        "accounts" : [
            {
                "imap" : {
                    "prettyName" : "OpenPaas (<%= user.preferredEmail %>)",
                    "hostName" : "openpaas.linagora.com",
                    "username" : "<%= user.preferredEmail %>",
                    "port" : 143,
                    "socketType" : "2"
                },
                "smtp" : {
                    "description" : "OpenPaas SMTP (<%= user.preferredEmail %>)",
                    "hostname" : "smtp.linagora.com",
                    "username" : "<%= user.preferredEmail %>",
                    "port" : 587,
                    "socketType" : "2"
                },
                "identities" : [
                    {
                        "identityName" : "Default (<%= user.preferredEmail %>)",
                        "email" : "<%= user.preferredEmail %>",
                        "fullName" : "<%= user.firstname %> <%= user.lastname %>",
                        "organization" : "Linagora",
                        "autoQuote" : true,
                        "replyOnTop" : "1",
                        "sigBottom" : false,
                        "sigOnForward" : true,
                        "sigOnReply" : true,
                        "attachSignature" : false,
                        "htmlSigText" : "<font style='color: red;'>Hello !</font>",
                        "htmlSigFormat" : true,
                        "fccFolder" : "%serverURI%/Sent",
                        "draftFolder" : "%serverURI%/Drafts"
                    }
                ]
            }
        ],
        "addons" : [
            {
                "id" : "{e2fda1a4-762b-4020-b5ad-a41df1933103}",
                "name" : "Lightning",
                "versions" : [
                    {
                        "version" : "4.7",
                        "minAppVersion" : "45",
                        "platforms" : [
                            {
                                "platform" : "Linux",
                                "url" : "https://addons.mozilla.org/thunderbird/downloads/file/430153/lightning-4.7-sm+tb-linux.xpi"
                            }
                        ]
                    }
                ]
            },
            {
                "id" : "cardbook@vigneau.philippe",
                "name" : "CardBook",
                "versions" : [
                    {
                        "version" : "16.7",
                        "url" : "https://addons.mozilla.org/thunderbird/downloads/file/579999/cardbook-16.7-tb.xpi"
                    }
                ]
            }
        ],
        "preferences" : [
            {
                "name" : "app.update.enabled",
                "value" : false,
                "overwrite" : true
            },
            {
                "name" : "extensions.update.enabled",
                "value" : true,
                "overwrite" : true
            },
            {
                "name" : "extensions.cardbook.firstOpen",
                "value" : false
            },
            {
                "name" : "extensions.cardbook.exclusive",
                "value" : false
            },
            {
                "name" : "extensions.cardbook.firstRun",
                "value" : false
            }
        ],
        "directories" : [
            {
                "dirName" : "OpenPaas",
                "uri" : "ldapUrl",
                "maxHits" : 50
            }
        ]
    }
}
```

### businessHours

- Scope: user configuration
- Description: specify the working hours and working days of the user
- Example:

```json
{
  "name" : "businessHours",
  "value" : [{
    // days of week. an array of zero-based day of week integers (0=Sunday)
    "daysOfWeek" : [1, 2, 3, 4, 5], // Monday - Friday
    "start": "09:00", / a start time (9am in this example)
    "end": "18:00" // an end time (6pm in this example)
  }]
}
```

### datetime

- Scope: user, domain, platform
- Description: specify the date time format in application
- Example:

```json
{
  "name" : "datetime",
  "value" : {
    "use24hourFormat" : false
  }
}
```
