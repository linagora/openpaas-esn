# linagora.esn.davproxy

This modules is a DAV proxy used to enhance the ESN user experience.

## Endpoints

All the endpoints under /addressbooks, /calendars and /json are handled by the DAV proxy.

On any route, putting a graceperiod query parameter will create a deferred operation: The initial request will be sent to the proxified service after the grace period.
