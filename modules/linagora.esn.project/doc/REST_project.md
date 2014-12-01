# /api/projects

## GET /api/projects/:id/invitable

Get the list of invitable members in the given project.

**Request Headers:**

- Accept: application/json

**Parameters:**

- id: The project id

**Request Parameters:**

- domain_id: The domain id to search into
- search: Search for given value in the invitable members (title, description, ...)
- limit: The maximum number of elements to return
- offset: The search offset

**Response Headers:**

- Content-Type: application/json

**Status Codes:**

- 200 OK - Invitable members
- 400 Bad request.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. User can not do a search.
- 404 Not found - Project not found.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    GET /api/projects/538e3bd6654d7c3307f990fa/invitable?search=node
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

    [
      {
        "id": "538e3bd6654d7c3307f990fb",
        "objectType": "community"
        "target": {
          "_id": "538e3bd6654d7c3307f990fb",
          "title": "NodeJs Experts"
        }
      },
      {
        "id": "538e3bd6654d7c3307f990fc",
        "objectType": "community"
        "target": {
          "_id": "538e3bd6654d7c3307f990fc",
          "title": "Mean",
          "description": "The mean stack: Nongo, Express, Angular, Node"
        }
      }
    ]

## POST /api/projects/:id/members

Add a new member to the project.
Note that it does not have any effect if the member is already in the project.

**Request Headers:**

- Accept: application/json

**Parameters:**

- id: The project id

** Request body:**

JSON Member object as:

- id: The id of the member to add.
- objectType: The type of member

**Response Headers:**

- Content-Type: application/json

**Status Codes:**

- 201 Created - Given Member is now a member of the community.
- 400 Bad request.
- 401 Unauthorized. The user is not authenticated on the platform.
- 404 Not found - Project not found.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    POST /api/projects/538e3bd6654d7c3307f990fa/members
    Accept: application/json
    Host: localhost:8080

    {
      "id": "538e3bd6654d7c3307f990fb",
      "objectType": "community"
    }

**Response:**

    HTTP/1.1 201 Created

    {
      "_id": "538e3bd6654d7c3307f990fa",
      "title": "My awesome project",
      ...
      "members": [
        "timestamps": {
          "creation": "Mon Dec 01 2014 11:02:51 GMT+0100 (CET)"
        },
        "member": {
          "id": "538e3bd6654d7c3307f990fb",
          "objectType": "community"
        }
      ]
    }

