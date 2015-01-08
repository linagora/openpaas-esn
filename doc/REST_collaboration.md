# /api/collaborations

## /api/collaborations/membersearch

Get all the collaborations where the given tuple is a member.

**Request Headers:**

- Accept: application/json

**Query Parameters:**

- objectType: The type of member to look for
- id: The id of the member to look for

**Response Headers**

- Content-Length: Document size

**Response JSON Object:**

- An array of collaborations where the given tuple is a member

**Status Codes:**

- 200 OK
- 400 Bad Request
- 401 Unauthorized
- 500 Internal server error

**Request:**

    GET /api/collaborations/membersearch?objectType=community&id=987654321
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "987654321",
      "title": "Mean Project",
      "description": "The Awesome MEAN stack project",
      "type": "project"
      "domain_ids": ["8292903883939282"],
      "timestamps": {
        "creation": "2014-05-16T09:47:11.703Z"
      },
      activity_stream: {
        uuid: "9330-0393-7373-7280",
        "timestamps": {
          "creation": "2014-05-16T09:47:11.704Z"
        }
      }
    },
    {
      "_id": "123456789",
      "title": "Node.js",
      "description": "All about node.js",
      "type": "project",
      "domain_ids": ["8292903883939282"],
      "timestamps": {
        "creation": "2014-05-16T09:47:11.703Z"
      },
      activity_stream: {
        uuid: "9330-0393-7373-7280",
        "timestamps": {
          "creation": "2014-05-16T09:47:11.704Z"
        }
      }
    }
