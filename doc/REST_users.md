## GET /api/users/{token}

Get a user from an authentication token (cf REST_token.md for more information about token).

**Request Headers:**

- Accept: application/json

**Parameters**

- token: A token ID

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok. With the user object
- 400 Bad request
- 404 Not found
- 500 Internal server error

**Request:**

    GET /api/users/token/929838839992882892
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
        _id: 123456789,
        firstname: "John",
        lastname: "Doe",
        emails: ["johndoe@linagora.com"]
    }