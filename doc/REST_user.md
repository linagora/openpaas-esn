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

# GET /api/user/profile

Get the current user profile.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile as JSON.
- 401 Unauthorized.

**Request:**

    GET /api/user/profile
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

    {
      "firstname": "John",
      "lastname": "Doe",
      "job_title": "Manager",
      "service": "Sales",
      "phone": "+33467455653222"
    }

# PUT /api/user/profile/{attribute_name}

Update an element of the current user profile.

**Parameters**

- attribute_name: The attribute name of the element to update (firstname, lastname, ...)

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

The attribute value.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. The profile element has been updated.
- 400 Bad Request.
- 401 Unauthorized. The current user does not have rights to update the user profile

**Request:**

    POST /api/user/profile/firstname
    Accept: application/json
    Host: localhost:8080

    Johnny

**Response:**

    HTTP/1.1 200 OK
