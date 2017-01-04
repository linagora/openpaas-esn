# Authentication

The authentication is based on [http://passportjs.com](passportjs).
The current document describes how the system have to be configured to use the different authentication strategies provided by the platform.

## Configuration

    {
      ...
      "auth": {
          "strategies": ["local", "mongo", "bearer", "mongo-ldap"]
        }
    }

Array containing the authentication strategies to be loaded by the application.
The application will go through all the authentication strategies until a valid
one is found for the current HTTP request.
Possible values are:

- local: Local configuration is defined in `./config/users.json` file.
- mongo: Uses the User collection in mongodb.
- bearer: OAuth2 authentication mechanism (cf [REST API](REST.md) for more details)
- mongo-ldap: Connect to a LDAP server defined in the global configuration parameter (cf [configuration](configuration.md) for more details)
  - The application will auto provision users on their first login.
  - The current strategy allows to authenticate the user on a LDAP instance and to create a user instance on the storage layer (MongoDB).
  - The LDAP connection settings are available per domain: A domain manager may be able to add multiple LDAP connection settings in its domain.
  - The passport strategy will look at all the available LDAP settings and will try to authenticate the user based on its credentials using the LDAP authentication mechanisms.
