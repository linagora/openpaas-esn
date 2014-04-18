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

- value: The attribute value.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. The profile element has been updated.
- 400 Bad Request.
- 401 Unauthorized. The current user does not have rights to update the user profile

**Request:**

    PUT /api/user/profile/firstname
    Accept: application/json
    Host: localhost:8080

    {value: 'Johnny'}

**Response:**

    HTTP/1.1 200 OK

## POST /api/user/profile/avatar

Post a new avatar for the currently logged in user. The posted avatar is set as the default avatar for the user. The image should be a square, and at least be 128x128 px.

**Request query strings parameters**

- mimetype: the MIME type of the image. Valid values are 'image/png', 'image/gif' and 'image/jpeg'
- size: the size, in bytes, of the POSTed image. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.

**Request Body:**

This endpoint expects the request body to be the raw image data

- 200 Ok. With the recorded image ID
- 400 Bad request. The current request is missing mandatory parameters
- 412 Precondition failed. The number of bytes recoreded by the file storage service differs from the number of bytes given by the user agent
- 500 Internal server error: there was a problem, either storing the file, manipulating the image, or updating the user properties.

**Request:**

    POST /api/user/profile/avatar?mimetype=image%2Fpng&size=12345
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        _id: '9f888058-e9e6-4915-814b-935d5b88389d'
    }

## GET /api/user/profile/avatar

Get the avatar for the currently logged in user.

**Request Headers:**

- Accept: application/json
- If-Modified-Since: Date

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json
- Last-Modified: Date

**Status Codes:**

- 200 Ok. With the stream of the avatar
- 304 Not modified. The avatar has not been changed since the last GET
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /api/user/profile/avatar
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT

