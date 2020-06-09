
> Note: this document is in progress. It will be updated during all the development process until the release.

# Upgrade instruction

If you are upgrading from OpenPaaS 1.1.x (Antares) to the 1.2.x, you will need to do these actions:

## Before upgrading

## After upgrading
#### 1. Fix the elasticsearch indexes

From your OpenPaaS folder, run these commands:

    node ./bin/cli.js reindex --type users