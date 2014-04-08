# /api/user

## GET /api/user

Get a the authenticated user information.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication

**Request:**

    GET /api/user
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