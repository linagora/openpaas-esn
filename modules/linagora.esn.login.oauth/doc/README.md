# linagora.esn.login.oauth

This module is used to login into OpenPaaS using OAuth providers.
To enable this, make sure you have `linagora.esn.login.oauth` in the modules array
of the local configuration file (e.g. `config/default.json`).

```
"linagora.esn.unifiedinbox",
"linagora.esn.admin",
"linagora.esn.login.oauth" <-- add this line
```

## Configuration

### Local configuration

The login providers can be activated from the local configuration file.
In order to activate a login provider, you have to add it to the auth element:

    "auth": {
      "oauth": {
        "strategies": ["facebook", "twitter", "google"]
      }
    }

Once the provider is added to the list of strategies (facebook, twitter and google strategies are activated from example above), you have to configure client secrets as defined in the section below.

### Global configuration

The configuration for each provider must be defined in the oauth document in the configuration collection like:

```
{
  "name": "oauth",
  "value": {
    "facebook": {
      "client_id": "YOUR CONSUMER KEY",
      "client_secret": "YOUR CONSUMER SECRET"
    },
    "google": {
      "client_id": "YOUR GOOGLE CLIENT ID",
      "client_secret": "YOUR GOOGLE CLIENT SECRET"
    },
    "twitter": {
      "consumer_key": "YOUR TWITTER CONSUMER KEY",
      "consumer_secret": "YOUR TWITTER CONSUMER SECRET"
    }
  }
}
```
