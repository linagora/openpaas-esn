
> Note: this document is in progress. It will be updated during all the development process until the release.

# What's new in this version

### Chat
The chat module is now enabled by default.

### Platform administration
- Domain administrators can now make users of their domain unsearchable, meaning users won't see each others in auto-complete fields and won't come out in search results. This is especially useful when using OpenPaaS to provide services to private individuals on a single domain.

### [Event sourcing](https://docs.open-paas.org/core/eventsourcing/)

- Almost everything happening on the platform (users login, users update, contacts/events create...) is now logged into Elasticsearch and available for auditing and history.
