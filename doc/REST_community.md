# /api/communities

## POST /api/communities

Create an ESN community.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- title: The community title
- description: The community description

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 201 Created. The community has been created.
- 400 Bad Request. Invalid request body or parameters

**Request:**

    POST /api/communities
    Accept: application/json
    Host: localhost:8080
    {
      "title": "Node.js",
      "description": "All about node.js"
    }

**Response:**

    HTTP/1.1 201 Created

# POST /api/communities/{community_id}/image

Post a new image for the given community.

**Request query strings parameters**

- mimetype: the MIME type of the image. Valid values are 'image/png', 'image/gif' and 'image/jpeg'
- size: the size, in bytes, of the POSTed image. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.

**Request Body:**

This endpoint expects the request body to be the raw image data

- 200 OK. With the recorded image ID
- 400 Bad request. The current request is missing mandatory parameters
- 412 Precondition failed. The number of bytes recoreded by the file storage service differs from the number of bytes given by the user agent
- 500 Internal server error: there was a problem, either storing the file, manipulating the image, or updating the user properties.

**Request:**

    POST /api/communities/123456789/image?mimetype=image%2Fpng&size=12345
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        _id: '9f888058-e9e6-4915-814b-935d5b88389d'
    }
    
# GET /api/communities/{community_id}/image

Get the community image.

**Request Headers:**

- Accept: application/json
- If-Modified-Since: Date

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json
- Last-Modified: Date

**Status Codes:**

- 200 Ok. With the stream of the image
- 304 Not modified. The image has not been changed since the last GET
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /api/communities/123456789/image
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT

## GET /api/communities

Get the communities list. The list is ordered by title.

**Request Headers:**

- Accept: application/json

**Response Headers**

- Content-Length: Document size

**Response JSON Object:**

- An array of communities

**Status Codes:**

- 200 OK
- 401 Unauthorized. The user is not authenticated on the platform.

**Request:**

    GET /api/communities
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "987654321",
      "title": "Mean",
      "description": "The Awesome MEAN stack"
    },
    {
      "_id": "123456789",
      "title": "Node.js",
      "description": "All about node.js"
    }
     
## GET /api/communities/{community_id}

Get a community.

**Parameters**

- community_id: The community ID

**Request Headers:**

- Accept: application/json

**Response Headers**

- Content-Length: Document size

**Response JSON Object:**

- The community object

**Status Codes:**

- 200 OK
- 401 Unauthorized. The user is not authenticated on the platform.

**Request:**

    GET /api/communities/123456789
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "123456789",
      "title": "Node.js",
      "description": "All about node.js"
    }

## DELETE /api/communities/{community_id}

Delete a community.

**Parameters**

- community_id: The community ID

**Request Headers:**

- Accept: application/json

**Status Codes:**

- 204 No content
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not delete the community.

**Request:**

    DELETE /api/communities/123456789
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No content
