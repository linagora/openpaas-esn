## GET /api/oauth/authorize

Redirect the user to an authorization endpoint

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok.
- 401 Unauthorized
- 500 Server Error.

**Request:**

    GET /api/oauth/authorize
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

## POST /api/oauth/authorize/decision

Handle a user's response to an authorization dialog.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok. With the token object
- 401 Unauthorized
- 500 Server Error.

**Request:**

    POST /api/oauth/authorize/decision
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

## POST /api/oauth/token

Handle requests to exchange an authorization grant for an access token.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok.
- 500 Server Error.

**Request:**

    POST /api/oauth/token
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
