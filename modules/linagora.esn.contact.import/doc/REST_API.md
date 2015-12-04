# /import/api

## POST /import/api/{type}

Import contacts from a specified type into OpenPaaS ESN.

**Request Headers**

- Accept: application/json

**Request URL Parameters:**

- type: The type of contacts to import.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 202 Valid request. The import has been started.
- 400 Bad request.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 404 Not found. No valid importer found.
- 500 Internal server error.

**Request:**

    POST /import/api/twitter
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 202 Accepted