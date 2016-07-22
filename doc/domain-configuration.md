# Domain configurations

OpenPaas supports different configurations for each domain.
A domain configuration is stored in `configurations` module under the
corresponding `features` collection of the domain.

A `features` document containing domain configurations has the following structure:

```JSON
{
  "domain_id" : ObjectId("domain_id"),
  "modules" : [
    {
      "name" : "configurations",
      "features" : [
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

## Configure domain configuration

Modifying domain configuration directly through MongoDB is not recommended. We
recommend to use **Administration Center** module that helps domain
administrators to easily configure configurations of the domain that they are
managing.
