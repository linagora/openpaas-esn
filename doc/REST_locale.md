# Locale API

This describes the REST API for the locale resource.
The locale resource is available at /api/locales.

## Operations

### List available locales

Get the list of available locales.

**Request**

- GET /api/locales

**Response**

- HTTP 200

    ['en', 'fr']

### Get the locale data

**Request**

- GET /api/locales/:locale
- Content Type: application/json

**Response**

- HTTP 200 with the locate content or default locale if no such locale:

    {
      "key1": "value1",
      "key2": "value2"
    }


### Get the current locale data

**Request**

- GET /api/locales/current
- Content Type: application/json

**Response**

- HTTP 200 with the current locale content:

    {
      "key1": "value1",
      "key2": "value2"
    }
