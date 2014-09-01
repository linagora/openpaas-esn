# /api/authenticationtoken

## GET /api/authenticationtoken

Get a new authentication token for the current authenticated user.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok. With the token object
- 400 Bad request
- 500 Internal server error

**Request:**

    GET /api/authenticationtoken
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      token: '132427377339939930'
      ttl: 60,
      user: '1234566789',
      created_at: '2014-05-16T09:47:11.703Z'
    }

## GET /api/authenticationtoken/{token}

Get the token content from the token ID if the token has not expired.

**Request Headers:**

- Accept: application/json

**Parameters**

- token: A token ID

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok. With the token object
- 400 Bad request
- 404 Not found. Occurs when token is not found ie does not exists or has expired
- 500 Internal server error

**Request:**

    GET /api/authenticationtoken/132427377339939930
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      token: '132427377339939930'
      ttl: 60,
      user: '1234566789',
      created_at: '2014-05-16T09:47:11.703Z'
    }

## GET /api/authenticationtoken/{token}/user

Get user information from an authentication token.

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

    GET /api/authenticationtoken/929838839992882892/user
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