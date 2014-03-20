# Locale API

This describes the REST API for the locale resource.
The locale resource is available at /api/locales.

## Operations

### GET /api/locales

Get the list of available locales.

**Response**

- HTTP 200

    ['en', 'fr']

### GET /api/locales/:locale

Get the locale data

**Request**

- Content Type: application/json

**Response**

- HTTP 200 with the locate content or default locale if no such locale:

    {
      "key1": "value1",
      "key2": "value2"
    }


### GET /api/locales/current

Get the current locale data

**Request**

- Content Type: application/json

**Response**

- HTTP 200 with the current locale content:

    {
      "key1": "value1",
      "key2": "value2"
    }
