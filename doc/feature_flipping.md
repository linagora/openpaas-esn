# Feature flipping

OpenPaaS supports features flipping. The list of features is per-domain and resides in the `configurations` MongoDB collection.

## Document structure

The document is structured based on modules level which the `module_name` can defined as `core` to designate the configurations for OpenPaaS core project. In other cases, it can be defined for any external modules (f.i `linagora.esn.unifiedinbox`, `linagora.esn.calendar`,...)

```
{
    "domain_id" : ObjectId("domain_id"),
    "modules" : [
        {
            "name" : "module_name",
            "configurations" : [
                {
                    "name" : "feature_name",
                    "value" : Any
                }, {
                    ...
                }
            ]
        },{
            ...
        }
    ]
}
```

## Register features flipping configuration

OpenPaaS supports configuring feature flippings via GUI in Administration Center. These configurations are applied for a certain OpenPaaS domain or whole platform globaly. In order to have the feature configurable in Admin Center, a feature must be registered by adding a specific registry in `.run` block as following:

``` javascript
.run(function(esnFeatureRegistry) {
  esnFeatureRegistry.add({
    name: 'Feature',
    configurations: [
      {
        displayIn: 'Control Center',
        name: 'control-center:feature'
      }
    ],
    description: 'feature description'
  });
});
```

The features flipping configurations are stored as `features`, a part of `core` configurations. The structure of `features` configuration:

```
{
    "domain_id" : ObjectId("domain_id"),
    "modules" : [
        {
            "name" : "core",
            "configurations" : [
                {
                    "name": "features",
                    "value": {
                        "control-center:feature": true,
                        "application-menu:feature2": false,
                        ...
                    }
                }
            ]
        }
    ]
}
```

## Inbox features

The following features are supported for the `linagora.esn.unifiedinbox` module:

```
{
    "name" : "view",
    "value" : "messages" (can be 'threads' also)
}
```
```
{
    "name" : "api",
    "value" : "http://host:port/jmap/account_id"
}
```
```
{
    "name" : "uploadUrl",
    "value" : "http://host:port/upload/account_id"
}
```
```
{
    "name" : "downloadUrl",
    "value" : "http://host:port/download/{blobId}/{name}"
}
```
```
{
    "name" : "isJmapSendingEnabled",
    "value" : false
}
```
```
{
    "name" : "isSaveDraftBeforeSendingEnabled",
    "value" : false
}
```
```
{
    "name" : "composer.attachments",
    "value" : false
}
```
```
{
    "name" : "maxSizeUpload",
    "value" : 20971520
}
```
```
{
    "name" : "twitter.tweets",
    "value" : false
}
```
```
{
    "name" : "drafts",
    "value" : false
}
```
```
{
    "name" : "swipeRightAction",
    "value" : "markAsRead" (default) | "moveToTrash"
}
```
