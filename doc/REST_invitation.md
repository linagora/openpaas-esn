# Invitation API

This describes the REST API for the invitation resource. The document store resource is available at /api/invitation.

## Operations

### Get invitation

**Request**

- GET /api/invitation/:uuid
- Content Type: application/json

**Response**

- HTTP 200

    {
      "type": "invitation_type",
      "uuid": "123456789",
      "data": {
        "foo": "bar",
        "bar": "baz"
      }
    }

- HTTP 404 if there is no such invitation

### Create an invitation

**Request**

- POST /api/invitation
- Content Type: application/json

    {
      "type": "invitation_type",
      "data": {
        "foo": "bar",
        "bar": ""baz
      }
    }

- The invitation_type os mandatory and will be used to fire the right invitation handler
- The data fragment is 'open'. It is up to the invitation handler implementation to deal with its validation.

**Response**

- HTTP 201 if the invitation has been created with the invitation as JSON:

    {
      "type": "invitation_type",
      "uuid": "123456789",
      "data": {
        "foo": "bar",
        "bar": "baz"
      }
    }

- HTTP 40X for client-side error
- HTTP 500 for server-side error


### Finalize the invitation

**Request**

- PUT /api/invitation/:uuid
- Content Type: application/json

    {
      "data": {
        "foo": "bar",
        "bar": "baz"
      }
    }

**Note**: The request payload is open. It is up to the invitation handler to get it and validate it.

**Response**

- HTTP 201 if the invitation is finalized. The invitation handler may also return some JSON within the response body.
- HTTP 40X for client-side error
- HTTP 500 for server-side error
