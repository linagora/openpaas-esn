# /api/things

## GET /things/:id

Get one thing of id :id.

**Query Parameters:**

- none

**Request JSON Object:**

- none

**Response Headers:**

- Accept: application/json

**Status Codes:**

- 200 Ok. with the thing
- 404 Not found. No thing found for the given :id
- 500 Internal Server Error

**Request:**

    GET /things/12345
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        "name": "aName",
        "content": "aContent",
    }

## POST /things

Creates a new thing from the request body.

**Query Parameters:**

- none

**Request JSON Object:**

- name: name of the thing. it is required
- content: content of the thing. it is required

**Request Headers:**

- none

**Response JSON Object**

- id : the id of the new created thing

**Status Codes:**

- 201 Created. with the id of the new thing
- 500 Internal Server Error

**Request:**

    POST /api/things
    Accept: application/json
    Host: localhost:8080

    {
      "name": "aName",
      "content": "aContent",
    }

**Response:**

    HTTP/1.1 201 Created
    {
      "id":"5506df2b7ef1d0473511bc9e"
    }

## DELETE /things/:id

Delet a thing of id :id.

**Query Parameters:**

- none

**Request JSON Object:**

- none

**Request Headers:**

- none

**Response JSON Object**

- id : the id of the deleted thing

**Status Codes:**

- 200 Ok. with the id of the deleted thing
- 404 Not found. No thing found for the given :id
- 500 Internal Server Error

**Request:**

    DELETE /api/things/12345
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
      "id":"5506df2b7ef1d0473511bc9e"
    }
