
> Note: this document is in progress. It will be updated during all the development process until the release.

# Upgrade instruction

If you are upgrading from OpenPaaS 1.1.x (Antares) to the 1.2.x, you will need to do these actions:

## Before upgrading

## After upgrading
#### Fix the elasticsearch indexes
As platform admin, you will need to reindex users as the index schema has changed.
To do that:
- Login as platform admin
- Go to the Administration module -> Maintenance page
- In the Elasticsearch/User index section, RUN "Correct the index configuration and reindex data (slow)".