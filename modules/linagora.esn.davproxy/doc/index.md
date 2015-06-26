# linagora.esn.davproxy

This modules is a DAV proxy used to enhance the ESN user experience.

## Endpoints

All the endpoints under /addressbooks, /calendars and /json are handled by the DAV proxy.

Some processing is actually added to the following endpoints:

### DELETE /addressbooks/:bookId/contacts/:contactId.vcf

The contact deletion is effective after a 'grace period'.
The user is able to cancel the delete operation during this period by sending a graceperiod cancel message (cf graceperiod API documentation).

### PUT /addressbooks/:bookId/contacts/:contactId.vcf

The contact creation is effective after a 'grace period'.
The user is able to cancel the create operation during this period by sending a graceperiod cancel message (cf graceperiod API documentation).
