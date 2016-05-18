# Feature flipping

OpenPaas supports features flipping. Currently by editing a Mongo document in the database directly.
The list of features is per-domain and resides in the `features` collection.

## Document structure

The document has the following structure:

```
{
    "domain_id" : ObjectId("domain_id"),
    "modules" : [
        {
            "name" : "module_name",
            "features" : [
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
    "name" : "swipeRightAction",
    "value" : "markAsRead" (default) | "moveToTrash"
}
```
