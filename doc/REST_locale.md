# /api/locales

## GET /api/locales

Get the list of available locales.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters

**Request:**

    GET /api/locales
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    ['en', 'fr']

## GET /api/locales/{locale}

Get the locale data.

**Parameters:**

- locale: The name of the locale to get information from.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters

**Request:**

    GET /api/locales/en
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
        "key1": "value1",
        "key2": "value2"
    }

## GET /api/locales/current

Get the current locale data.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK

**Request:**

    GET /api/locales/current
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
        "key1": "value1",
        "key2": "value2"
    }
