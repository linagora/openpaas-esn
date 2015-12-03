# linagora.esn.contact.import

This modules provides APIs to import contact from external accounts into OpenPaaS ESN.

# /import/api/:type

## POST /import/api/twitter

Import Twitter followings into OpenPaaS ESN.

**Request Headers**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 202 Valid request. the import is processing
- 500 Internal server error.

**Request:**

    POST /import/api/twitter
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 202 Accepted