# /api/collaborations

## GET /api/collaborations/{objectType}/{id}/members

List all members of the {objectType} collaboration of id {id}.
Currently {objecType} are either **community** or **project**.

**Request Headers:**

- Accept: application/json

**Parameters:**

- objectType: community || project
- id: the wanted id

**Query Parameters:**

- limit (int): The number of members to return. This will only keep the N first members (where N=limit). Default value is 50.
- offset (int): Start the list of members after skipping N members (where N=offset). For example, if the size of the members list is 100 and the offset is 50, the result list will contain only members from 50 to 99 (list index starts at index 0).
- objectTypeFilter (string): Only show members of a certain object type, e.g. `user` or `community`. If prefixed with an exclamation mark, the object type query will be inverted.

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
        },
        "objectType": "user",
        "id": "5375de9fd684db7f6fbd5010"
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
        },
        "objectType": "user",
        "id": "5375de9fd684db7f6fbd5011"
      },
      {
        "community": {
          "_id": "5375de9fd684db7f6fbd5012",
          "title": "Mu Awesome Community",
          "domains": [
            {
              "domain_id": "5375de4bd684db7f6fbd4f98",
              "joined_at": "2014-05-16T10:47:11.732Z"
            }
          ],
          "timestamps": {
            "creation": "2014-05-16T09:48:11.703Z"
          }
        },
        "metadata": {
          "timestamps": {
            "creation": "2014-09-16T20:17:51.449Z"
          }
        },
        "objectType": "community",
        "id": "5375de9fd684db7f6fbd5012"
      }
    ]

## GET /api/collaboration/{objectType}/{id}/invitablepeople

Get the list of peoples (for now only users of the ESN) who can be invited in the {objectType}.

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- community_id: The community id

**Request Query Strings Parameters:**

- limit (int): The number of peoples to return. This will only keep the N first peoples (where N=limit). Default value is 5.
- search (string): Search the people "firstname", "lastname" and "email" fields in case insensitive and accent agnostic way. Note that when there are more than one word in the search string (separated by one or more spaces), the search will become an AND. For example: 'search=foo bar' will search members where firstname, lastname and email contain foo AND bar.

**Response Headers:**

- X-ESN-Items-Count: The number of peoples in the result list
- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok. With the list of peoples
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 404 Not found.
- 500 Internal server error.

**Request:**

    GET /api/collaboration/community/987654321/invitablepeople
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    X-ESN-Items-Count: 2
    [
        {
            _id: 123456789,
            firstname: "John",
            lastname: "Doe",
            emails: ["johndoe@linagora.com"]
        },
        {
            _id: 987654321,
            firstname: "Foo",
            lastname: "Bar",
            emails: ["foobar@linagora.com"]
        },
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

## GET /api/collaborations/:id/externalcompanies

This route sends back the companies of all external users which are members of the collaboration.
Currently, it only searches the companies of users who are direct members of the collaboration,
ie. which are not member of this collaboration through another collaboration

**Request Headers:**

- Accept: application/json

**Parameters:**
- id: The id of the collaboration

**Query Parameters:**

- query: A search phrase to be contained in the returned company names

**Response Headers**

- Content-Length: Document size

**Response JSON Object:**

- An array of external companies which have a user belonging to the collaboration

**Status Codes:**

- 200 OK
- 400 Bad Request
- 401 Unauthorized
- 500 Internal server error

**Request:**

    GET /api/collaborations/123456/externalcompanies?search=lin
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        objectType: 'company',
        id: 'linagora'
      },
      {
        objectType: 'company',
        id: 'linuxFR'
      }
    ]

## PUT /api/collaborations/{objectType}/{id}/membership/{user_id}

Adds an item in the {objectType} membership requests list i.e. the user request to be part of the {objectType}.

Notes:

- Only private and restricted {objectType} support membership requests
- A user cannot make a membership request for a {objectType} he is already member of.

**Request Headers:**

- Accept: application/json

**Parameters:**

- {objectType}: The community id
- {id}: The {objectType} id
- user_id: The user id

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

The updated {objectType}.

**Status Codes:**

- 200 OK - Updated community.
- 400 Bad request.
- 401 Unauthorized. The user is not authenticated on the platform.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    PUT /api/collaborations/community/538e3bd6654d7c3307f990fa/membership/538e3bd6654d7c3307f990fb
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "538e3bd6654d7c3307f990fa",
      "title": "Node.js",
      "description": "All about node.js",
      "domain_ids": ["9328938983983"],
      "timestamps": {
        "creation": "2014-05-16T09:47:11.703Z"
      },
      activity_stream: {
        uuid: "9330-0393-7373-7280",
        "timestamps": {
          "creation": "2014-05-16T09:47:11.704Z"
        }
      },
      membershipRequest: "2014-05-16T09:47:11.704Z"
    }

## GET /api/collaboration/{objectType}/{id}/membership

Get the membership requests for the given {objectType}.

Notes:

- Only private and restricted {objectType} support membership requests
- Only {objectType} manager/creator can issue this type of request

**Request Headers:**

- Accept: application/json

**Parameters:**

- {objectType}: The community id
- {id}: The {objectType} id

**Query Parameters:**

- limit (int): The number of request to return. This will only keep the N first requests (where N=limit). Default value is 50.
- offset (int): Start the list of requests after skipping N requests (where N=offset). For example, if the size of the request list is 100 and the offset is 50, the result list will contain only requests from 50 to 99 (list index starts at index 0).

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

Array of membership requests with user information.

**Status Codes:**

- 200 OK
- 400 Bad request
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user does not have read rights for the {objectType}: User may not belong to the {objectType} managers.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    GET /api/collaboration/community/538e3bd6654d7c3307f990fa/membership
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
          "workflow": "request",
          "timestamps": {
            creation: "2014-05-16T09:47:11.704Z"
          }
        }
      ]
