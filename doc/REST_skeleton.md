# /api/...

## GET /api/.../{parameter}/...

Get...

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- parameter: ...

**Request Query Strings Parameters:**

- parameters1: ...
- parameters2: ...

**Request JSON Object:**

- field1: ...
- field2: ...

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

- field1: ...
- field2: ...

**Status Codes:**

- 200 Ok.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 404 Not found.
- 500 Internal server error.

**Request:**

    GET /api/.../{parameter}/...
    Accept: application/json
    Host: localhost:8080
    {
      field1: ...,
      field2: ...
    }

**Response:**

    HTTP/1.1 200 Ok
    {
      ...
    }


## POST /api/.../{parameter}/...

Create...

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- parameter: ...

**Request Query Strings Parameters:**

- parameters1: ...
- parameters2: ...

**Request JSON Object:**

- field1: ...
- field2: ...

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

- field1: ...
- field2: ...

**Status Codes:**

- 201 Created.
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 500 Internal server error.


**Request:**

    POST /api/.../{parameter}/...
    Accept: application/json
    Host: localhost:8080
    {
      field1: ...,
      field2: ...
    }

**Response:**

    HTTP/1.1 201 Created
    {
      ...
    }
