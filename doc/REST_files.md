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

