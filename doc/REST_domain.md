# /api/domains

## POST /api/domains

Create an ESN domain.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- name: The domain name
- company_name: The company name

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 201 Created. The domain has been created.
- 400 Bad Request. Invalid request body or parameters

**Request:**

    POST /api/domains
    Accept: application/json
    Host: localhost:8080
    {
      "name": "foo",
      "company_name": "bar"
    }

**Response:**

    HTTP/1.1 201 Created

## GET /api/domains/{domain_name}/{company_name}

Checks if a domain and company pair already exists.

**Parameters:**

- domain_name: A domain name
- company_name: A company name

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. The company (company_name) is found in the domain (domain_name)
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. The company (company_name) has not been found in the domain (domain_name)

**Request:**

    GET /api/domains/esn/linagora
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
