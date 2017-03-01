# linagora.esn.oauth.consumer

This module is used to link external accounts to OpenPaaS using OAuth.

## Configuration

The configuration for each provider must be defined in the oauth document in the configuration collection like:

```
{
  "_id": "oauth",
  "twitter": {
    "consumer_key": "YOUR CONSUMER KEY",
    "consumer_secret": "YOUR CONSUMER SECRET"
  }
}
```

## Supported providers

### Twitter

Register a new application on https://apps.twitter.com/ and add the following JSON to the OAuth document:

```
"twitter": {
  "consumer_key": "YOUR_CONSUMER_KEY",
  "consumer_secret": "YOUR_CONSUMER_SECRET"
}
```

### Facebook

Register a new application on https://developers.facebook.com and add the following JSON to the OAuth document:

```
"google": {
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

### Google

Register a new application on https://console.developers.google.com/ and add the following JSON to the OAuth document:

```
"google": {
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

### Github

Register a new application on https://github.com/settings/developers or on your organization settings and add the following JSON to the OAuth document:

```
"github": {
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```
