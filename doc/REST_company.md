# /api/companies

## GET /api/companies

Get companies list.

**Query Parameters:**

- name (string): The name of the company

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

Array of companies where company is defined as:

- name: The company name

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. No company found.

**Request:**

    GET /api/companies?name=linagora
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "name": "The company name"
      }
    ]
