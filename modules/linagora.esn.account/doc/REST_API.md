# /account/api/accounts

## GET /account/api/accounts

Get the current user accounts

**Request Headers**

- Accept: application/json

**Request Query Parameters**

- type (string): The type of account to get. Possible values are 'email' and 'oauth'.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 500 Internal server error.

**Request:**

    GET /account/api/accounts?type=oauth
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

    [
      {
        "type": "oauth",
        "data": {
          "provider": "twitter",
          "id": "13024132",
          "username": "chamerling",
          "display_name": "Christophe Hamerling",
          "token": "13024132-o8Sr2ybj0ve4U0mPpxW7",
          "token_secret": "XRCOXgzqAjyu5Qfsx9c6v2c"
        },
        "timestamps": {
          "creation": "2015-10-08T14:56:15.315Z"
        },
        "preferredEmailIndex": 0,
        "emails": [],
        "hosted": false
      }
    ]