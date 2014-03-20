# Domain API

This describes the REST API for the domain resources. The domain resource available at /api/domains.

## Operations

### POST /api/domains

Create a domain.

**Request**

- Content-Type : application/json
- Payload:

    {
      "name": "foo",
      "company_name": "bar"
    }

**Response**

- HTTP 201 if the domain has been created
- HTTP 400 for client-side error
- HTTP 500 for server-side error

### GET /api/domains/:domain_name/:company_name

Checks if a domain and company pair already exists.

**Response**

- HTTP 200 if the company (company_name) is found in the domain (domain_name)
- HTTP 400 for client-side error
- HTTP 500 for server-side error
