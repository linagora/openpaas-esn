# /api/profile

## GET /api/profile/{uuid}

Get a user profile.

**Parameters**

- uuid: The user ID

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. The user has not been found

**Request:**

    GET /api/profile/34560130
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