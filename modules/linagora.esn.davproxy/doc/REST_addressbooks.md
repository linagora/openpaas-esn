# /dav/api/addressbooks

## GET /dav/api/addressbooks/{address_book}/contacts.json

Get contacts of the address book identified by the address_book parameter.

**Request Headers**

- Accept: application/vcard+json

**Request Parameters**

- address_book: The id of the address book to query.

**Request Query Parameters**

- search (string): Search the contacts for the given string.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/vcard+json

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 403 Forbidden. The current user does not have enough rights to query the address book.
- 404 Not Found. The address book has not been found
- 500 Internal server error.


**Request:**

    GET /dav/api/addressbooks/5375de4bd684db7f6fbd4f97/contacts.json?search=bruce
    Accept: application/vcard+json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_links": {
        "self": {
          "href": "/addressbooks/5375de4bd684db7f6fbd4f97/contacts.json?search=bruce"
        }
      },
      "dav:syncToken": 6,
      "_embedded": {
        "dav:item": [
          {
            "_links": {
              "self": "/addressbooks/5375de4bd684db7f6fbd4f97/contacts/myuid.vcf"
            },
            "etag": "\'6464fc058586fff85e3522de255c3e9f\'",
            "data": [
              "vcard",
              [
                ["version", {}, "text", "4.0"],
                ["uid", {}, "text", "myuid"],
                ["n", {}, "text", ["Bruce", "Willis", "", "", ""]]
              ]
            ]
          }
        ]
      }
    }
