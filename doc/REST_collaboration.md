# /api/collaborations

## GET /api/collaborations/{objectType}/{id}/members

List all users who are members of the {objectType} of id {id}.
Currently {objecType} are either **community** or **project**.

**Request Headers:**

- Accept: application/json

**Parameters:**

- objectType: community || project
- id: the wanted id

**Query Parameters:**

- limit (int): The number of members to return. This will only keep the N first members (where N=limit). Default value is 50.
- offset (int): Start the list of members after skipping N members (where N=offset). For example, if the size of the members list is 100 and the offset is 50, the result list will contain only members from 50 to 99 (list index starts at index 0).

**Response Headers:**

- Content-Type: application/json
- X-ESN-Items-Count: The number of members in the {objectType}

**Response JSON Object**

Array of {objectType} members.

**Status Codes:**

- 200 OK
- 400 Bad request
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden - The user does not have enough rights to get the {objectType} members.
- 404 Not found - {objectType} or user not found. The error message will contain details.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    GET /api/collaborations/community/538e3bd6654d7c3307f990fa/members
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "user": {
          "_id": "5375de9fd684db7f6fbd5010",
          "currentAvatar": "5f9cef20-494c-11e4-a670-e32f9c5817b5",
          "firstname": "Bruce",
          "lastname": "Willis",
          "job_title": "Die Harder",
          "domains": [
            {
              "domain_id": "5375de4bd684db7f6fbd4f98",
              "joined_at": "2014-05-16T09:47:11.732Z"
            }
          ],
          "timestamps": {
            "creation": "2014-05-16T09:47:11.703Z"
          },
          "emails": [
            "bruce@willis.name"
          ]
        },
        "metadata": {
          "timestamps": {
            "creation": "2014-09-16T20:16:51.449Z"
          }
        }
      },
      {
        "user": {
          "_id": "5375de9fd684db7f6fbd5011",
          "currentAvatar": "5f9cef20-494c-11e4-a670-e32f9c5817b6",
          "firstname": "Karate",
          "lastname": "Kid",
          "job_title": "Foo Foo Fighter",
          "domains": [
            {
              "domain_id": "5375de4bd684db7f6fbd4f98",
              "joined_at": "2014-05-16T10:47:11.732Z"
            }
          ],
          "timestamps": {
            "creation": "2014-05-16T09:48:11.703Z"
          },
          "emails": [
            "karatekid@savetheworld.com"
          ]
        },
        "metadata": {
          "timestamps": {
            "creation": "2014-09-16T20:17:51.449Z"
          }
        }
      }
    ]

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
