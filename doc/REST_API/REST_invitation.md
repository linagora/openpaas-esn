# /api/invitations

## GET /api/invitations/{uuid}

Get an invitation from its UUID.

**Parameters:**

- uuid: The invitation identifier

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

- uuid: The invitation identifier
- type: The invitation type
- data: The invitation data

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. The invitation has not been found.

**Request:**

    GET /api/invitations/34560
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
        "type": "invitation_type",
        "uuid": "123456789",
        "data": {
            "foo": "bar",
            "bar": "baz"
        }
    }

## POST /api/invitations

Creates an invitation.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- type (string): The invitation type. It will be used to fire the right invitation handler.
- data (object): The invitation data. It is up to the invitation handler implementation to deal with its validation.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 201 Created.
- 400 Bad Request. Invalid request body or parameters

**Request**

    POST /api/invitations
    Accept: application/json
    Host: localhost:8080
    {
      "type": "invitation_type",
      "data": {
        "foo": "bar",
        "bar": ""baz
      }
    }

**Response**

    HTTP/1.1 201 Created
    {
        "type": "invitation_type",
        "uuid": "123456789",
        "data": {
            "foo": "bar",
            "bar": "baz"
        }
    }

## PUT /api/invitations/{uuid}

Finalize the invitation.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- data (object): The invitation data. It is up to the invitation handler implementation to deal with this data during the finalize if needed.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 201 Created. The invitation has been finalized.
- 400 Bad Request. Invalid request body or parameters

**Request**

    PUT /api/invitations/34560
    Accept: application/json
    Host: localhost:8080
    {
        "data": {
            "foo": "bar",
            "bar": ""baz
        }
    }

**Response**

    HTTP/1.1 201 Created
    {
        "type": "invitation_type",
        "uuid": "34560",
        "data": {
            "foo": "bar",
            "bar": "baz",
            "baz": "done"
        }
    }
