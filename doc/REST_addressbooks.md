# /api/addressbooks

## GET /api/addressbooks

Get the addressbooks of a user.

**Request Headers:**

- Accept: application/json

**Query Parameters:**

- creator (string): The id of the owner of the addressbooks
- limit (number): The number of addressbooks to return

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the list of addressbooks
- 500 Internal server error: there was a problem.

**Request:**

    GET /api/addressbooks?creator=539b0ba6b801603217aa2e24
    Accept: application/json

**Response:**

    HTTP/1.1 200 OK
    X-Esn-Item-Count: 1
    [
        {
            "_id": "537efb2a078e20a54b213319",
            "creator": "533d548263df5db21b485155",
            "name": "Google Contacts",
            "timestamps": {
                "creation": "2014-05-23T13:43:02.426Z"
            },
            "schemaVersion": 1
        }
    ]