# Company API

This describes the REST API for the company resources. The company resource available at /api/companies.

## Operations

### Search a company

Search a company from its name.

**Request**

- GET /api/companies?name=company_name

**Response**

- HTTP 200 if the company exists

    [
      {
        "name": "The company name"
      }
    ]

- HTTP 404 if company can not be found
- HTTP 500 for server-side error
