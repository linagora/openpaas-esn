# /api/ldap

## GET /api/ldap/search

Search the ldap's users

**Request Parameters**

- limit (int): The number of users to return. This will only keep the N first users (where N=limit). Default value is 20.
- search (string): Search the ldap's users fields in case insensitive and accent agnostic way.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- X-ESN-Items-Count: The number of users in the result list
- Content-Length: Document size
- Content-Type: application/json

**Response**

An array of profile of ldap's users.

**Status Codes:**

- 200 OK
- 401 Unauthorized. The user is not authenticated on the platform.
- 500 Server error. LDAP search may be have error.

**Request:**

    POST /api/ldap/search
    Accept: application/json
    Host: localhost:8080

**Response:**

    [
      {
       "firstname": "John",
       "lastname": "Doe",
       "job_title": "Manager",
       "service": "Sales",
       "phone": "+33467455653222"
      }
    ]
