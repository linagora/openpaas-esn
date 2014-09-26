# /api/files

## POST /api/files

Creates a file to be stored on the ESN system

**Request Headers:**

- Accept: application/json

**Query Parameters:**

- name: (optional) The filename to store
- mimetype: The MIME type of the data being stored
- size: The expected file size. This will be compared with the bytes received, ensuring there is no dataloss.

**Request Body:**

This endpoint expects the request body to be the raw file data.

**Status Codes:**

- 201 Created. The file has been created.
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The user is not authenticated on the platform.
- 412 Precondition Failed. The received file size does not match the size parameter

**Request:**

    POST /api/files?name=myfile&mimetype=text%2Fplain&size=11
    Accept: application/json
    Host: localhost:8080

    hello world

**Response:**

    HTTP/1.1 201 Created

    {
      "_id": "e0bbd496-9ca9-4c2d-8312-a13e837e0b60"
    }

# GET /api/files/{id}

Retrieve the raw file data with the given id.

**Request Headers:**

- If-Modified-Since: Date (optional)

**Response Headers:**

- Content-Length: Document size
- Content-Type: The MIME type of the document being streamed.
- Last-Modified: Date

**Status Codes:**

- 200 OK. The file data will be streamed
- 304 Not Modified. The file has not been changed since the last modified date.
- 400 Bad Request. The id parameters is missing.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not Found.
- 503 Internal Server Error: There was a problem recovering the file.

**Request:**

    GET /api/files/e0bbd496-9ca9-4c2d-8312-a13e837e0b60
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Content-Type: text/plain
    Content-Length: 11
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT

    hello world
