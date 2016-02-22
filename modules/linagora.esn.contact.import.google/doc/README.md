# linagora.esn.contact.import.google

## Google contact importer

* Google Oauth Authentication:
    * In this module, we use the refresh token in user import account to get new access token of google server
    * Use new token to query all google contacts.

### For more details:
- https://developers.google.com/identity/protocols/OAuth2WebServer#incrementalAuth.
- https://developers.google.com/google-apps/contacts/v3/reference#contacts-query-parameters-reference