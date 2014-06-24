# /api/filestore

## GET /api/filestore/{id}

Get the content of the file stored with id {id}

**Response Headers:**

- Content-Length: File length
- Content-Type: your file content type

**Response body**

The file contents

**Status Codes:**

- 200 OK
- 404 Not Found
- 500 Internal server error

**Request:**

    GET /api/filestore/file123456789
    Accept: application/json
    Content-Type: application/binary
    Host: localhost:8080

**Response:**

    [..file contents...]

## PUT /api/filestore/{id}

Put a file to be stored. {id} is the unique identifier of this file, and is provided by the client;

**Request Headers**

- Content-Type: [the content type of your stored file]

**Response Headers:**

- Content-Type: application/json

**Response body**

The stored file meta data.

**Status Codes:**

- 200 OK
- 500 Internal server error

**Request:**

    PUT /api/filestore/file123456789
    Accept: application/json
    Content-Type: application/binary
    Host: localhost:8080

**Response:**

    {
      "_id":"53a951473c8394644fcf9642",
      "contentType":"application/binary",
      "length":28034,
      "chunkSize":1024,
      "uploadDate":"2014-06-24T10:21:59.414Z",
      "aliases":null,
      "metadata":
        {
          "id":"1234"
        },
      "md5":"c9089f3c9adaf0186f6ffb1ee8d6501c"
    }


