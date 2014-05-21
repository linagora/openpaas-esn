# Authentication

The authentication is based on [http://passportjs.com](passportjs).
The current document describes how the system have to be configured to use the different authentication strategies provided by the platform.


## Automatic user provisioning

The web application can be configured to auto provision users on their first login.
In order to achieve that, the application has to use a specific strategy which will authenticate user on an external system, and then create the user once first authentication is successful.

The current strategy allows to authenticate the user on a LDAP instance and to create a user instance on the storage layer (MongoDB).

### Configuration

The 'mongo-ldap' strategy has to be activated in the config/default.json file:

    {
      ...
      "auth": {
          "strategies": ["local", "mongo-ldap"]
        }
    }

The LDAP connection settings are available per domain: A domain manager may be able to add as many LDAP connection settings in its domain.
The passport strategy will look at all the available LDAP settings and will try to authenticate the user based on its credentials using the LDAP authentication mechanisms.

As an example, a LDAP connection settings looks like:

    {
      "_id": ObjectId("537c8c67c690f1ae5f5c0a6f"),
      "name": "linagora",
      "domain": ObjectId("5375de4bd684db7f6fbd4f98"),
      "configuration": {
        "url": "ldap://localhost:389",
        "adminDn": "uid=admin,ou=sysusers,dc=lng",
        "adminPassword": "supersecret",
        "searchBase": "ou=users,dc=linagora.com,dc=lng",
        "searchFilter": "(mail={{username}})"
      }
    }
