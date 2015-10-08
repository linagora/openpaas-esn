# linagora.esn.oauth.consumer

This module is used to link external accounts to OpenPaaS using OAuth.

## Configuration

The configuration for each provider must be defined in the oauth document in the configuration collection like:

{
  "_id": "oauth",
  "twitter": {
    "consumer_key": "YOUR CONSUMER KEY",
    "consumer_secret": "YOUR CONSUMER SECRET"
  }
}

## Supported providers

### Twitter

Register a new application on https://apps.twitter.com/