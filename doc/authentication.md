# Authentication

The authentication is based on [http://passportjs.com](passportjs).
The current document describes how the system have to be configured to use the different authentication strategies provided by the platform.


## Automatic user provisioning

The application will auto provision users on their first login.

The current strategy allows to authenticate the user on a LDAP instance and to create a user instance on the storage layer (MongoDB).

### Configuration

The 'mongo-ldap' strategy has to be activated in the config/default.json file:

    {
      ...
      "auth": {
          "strategies": ["local", "mongo-ldap"]
        }
    }

The LDAP connection settings are available per domain: A domain manager may be able to add multiple LDAP connection settings in its domain.
The passport strategy will look at all the available LDAP settings and will try to authenticate the user based on its credentials using the LDAP authentication mechanisms.

As an example, In a `configurations` document containing domain configurations, an array of LDAP connection settings looks like:

    {
      "_id": ObjectId("537c8c67c690f1ae5f5c0a6f"),      
      "domain_id": ObjectId("5375de4bd684db7f6fbd4f98"),
      "modules": [
        {
          "name": "configurations",
          "configurations": [
            {
              "name": "ldap",
              "value": [{
                "name": "linagora",
                "configuration": {
                  "url": "ldap://localhost:389",
                  "adminDn": "uid=admin,ou=sysusers,dc=lng",
                  "adminPassword": "supersecret",
                  "searchBase": "ou=users,dc=linagora.com,dc=lng",
                  "searchFilter": "(mail={{username}})",
                  "mapping": {
                    "firstname": "firstname",
                    "lastname": "lastname",
                    "email": "mailAlias"
                    }
                  }
              },
              {
                "name": "OpenPaas",
                "configuration": {
                  "url": "ldap://localhost:1389",
                  "searchBase": "ou=users,dc=linagora.com,dc=lng",
                  "searchFilter": "(mail={{username}})",
                  "mapping": {
                    "firstname": "firstname",
                    "lastname": "lastname",
                    "email": "mailAlias"
                  }
                }
              }
            ]
          ]
      ]
    }

- You can also define value of LDAP connection setting as an object if there is only one configuration which's set up
- The 'searchFilter' value is used to define where to find the user login in the LDAP entry.
In the example above, it means that we want to authenticate using the email attribute in the LDAP entry (username is the passport attribute name).
- The mapping hash is used to add additional attributes when provisioning the user.
In the example above, it will retrieve the firstname, lastname and mailAlias from the LDAP entry and add it into the user object which will be registered into the storage.
