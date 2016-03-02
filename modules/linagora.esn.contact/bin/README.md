# Contacts CLI

Always run this CLI from the root directory of the project

```
node ./modules/linagora.esn.contact/bin/cli --help
```

## Commands

**populate**

Creates random contacts for the user defined from the CLI options.

```
node ./modules/linagora.esn.contact/bin/cli populate --login admin@open-paas.org --password secret --url http://localhost:8080 web 123
```

Will create 123 contacts from the web data source on OpenPaaS running on http://localhost:8080 for user admin@open-paas.org with password secret.