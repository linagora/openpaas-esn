# /api/versions

## GET /api/versions

Get available versions from the API.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

An array of versions

**Status Codes:**

- 200 OK.
- 404 Not Found.

**Request:**

    GET /api/versions
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
        {
            "label": "OpenPaaS API version 0.1",
            "path": "v0.1"
        }
    ]

## GET /api/versions/:id

Get a version from its ID.

**Request URL Parameters:**

- id: Identifier of the version to fetch.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

The version object.

**Status Codes:**

- 200 OK
- 404 Not Found. The message does not exist.

**Request:**

    GET /api/messages/v0.1
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

    {
        "label": "OpenPaaS API version 0.1",
        "path": "v0.1"
    }

## GET /api/versions/latest

Get the latest version.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

The latest version id.

**Status Codes:**

- 200 OK
- 404 Not Found.

**Request:**

    GET /api/messages/latest
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

    {
        "latest": "v0.1"
    }
