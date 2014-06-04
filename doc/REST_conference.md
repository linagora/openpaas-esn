# /api/conferences

## GET /api/conferences

Get the list of conferences.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object**

An array of conferences.

**Status Codes:**

- 200 OK

**Request:**

    GET /api/conferences
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "_id": "538e3bd6654d7c3307f990fa",
        "creator": "5375de9fd684db7f6fbd5010"
        "attendees": [
          {
              "user": "537f0c2f7334bece4564c683",
              "timestamps": [
                  {
                      "step": "joined",
                      "_id": "538df8e110eca70000040b1d",
                      "date": "2014-06-03T16:33:37.836Z"
                  }
              ]
          }
        ],
        "timestamps": {
            "creation": "2014-06-03T21:19:18.766Z"
        }
      },
      {
        "_id": "538e3bd6654d7c3307f990fb",
        "creator": "5375de9fd684db7f6fbd5011"
        "attendees": [
          {
              "user": "537f0c2f7334bece4564c684",
              "timestamps": [
                  {
                      "step": "joined",
                      "_id": "538df8e110eca70000040b1d",
                      "date": "2014-06-03T16:33:37.836Z"
                  },
                  {
                      "step": "left",
                      "_id": "538df8e110eca70000040b1d",
                      "date": "2014-06-03T16:42:38.111Z"
                  }
              ]
          }
        ],
        "timestamps": {
            "creation": "2014-06-03T21:19:18.766Z"
        }
      }
    ]

## GET /api/conferences/{id}

Get a conference from its id.

**Request Headers:**

- Accept: application/json

**Parameters:**

- id: The conference id

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object**

A conference.

**Status Codes:**

- 200 OK
- 404 Not Found

**Request:**

    GET /api/conferences/538e3bd6654d7c3307f990fa
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "538e3bd6654d7c3307f990fa",
      "creator": "5375de9fd684db7f6fbd5010"
      "attendees": [
        {
            "user": "537f0c2f7334bece4564c683",
            "timestamps": [
                {
                    "step": "joined",
                    "_id": "538df8e110eca70000040b1d",
                    "date": "2014-06-03T16:33:37.836Z"
                }
            ]
        }
      ],
      "timestamps": {
          "creation": "2014-06-03T21:19:18.766Z"
      }
    }

## POST /api/conferences

Creates a new conference where the creator is the logged in user.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object**

The created conference.

**Status Codes:**

- 201 Created

**Request:**

    POST /api/conferences
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 201 Created
    {
      "_id": "538e3bd6654d7c3307f990fa",
      "creator": "5375de9fd684db7f6fbd5010"
      "attendees": [],
      "timestamps": {
          "creation": "2014-06-03T21:19:18.766Z"
      }
    }

## PUT /api/conferences/{id}/attendees

Update the current user status as attendee in the conference.

**Request Headers:**

- Accept: application/json

**Request Parameters:**

- action: join|leave

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object**

No response.

**Status Codes:**

- 204 No content
- 400 Bad request
- 404 Not found
- 500 Internal server error

**Request:**

    PUT /api/conferences/538e3bd6654d7c3307f990fa/attendees?action=join
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No Content

## PUT /conferences/{id}/attendees/{user_id}

Add an attendee to the conference. The caller must write access to the conference to perform this action (creator or moderator).

**Request Headers:**

- Accept: application/json

**Parameters:**

- id: Conference id
- user_id: User to add as attendee of the conference

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object**

No response.

**Status Codes:**

- 204 No content
- 400 Bad request
- 404 Not found (conference or user)
- 500 Internal server error

**Request:**

    PUT /api/conferences/538e3bd6654d7c3307f990fa/attendees/538df8e110eca70000040b1d
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No Content

## DELETE /conferences/{id}/attendees/{user_id}

Delete an attendee from the conference. The caller must write access to the conference to perform this action (creator or moderator).

**Request Headers:**

- Accept: application/json

**Parameters:**

- id: Conference id
- user_id: User to remove as attendee from the conference

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object**

No response.

**Status Codes:**

- 204 No content
- 400 Bad request
- 404 Not found (conference or user)
- 500 Internal server error

**Request:**

    DELETE /api/conferences/538e3bd6654d7c3307f990fa/attendees/538df8e110eca70000040b1d
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No Content

