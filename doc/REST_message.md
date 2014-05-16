# /api/messages

## GET /api/messages

Get messages from their IDs.

**Query Parameters:**

- ids (Array): Identifiers of the messages to fetch.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

An array of messages with all the messages defined in the input query parameters.
If a message is not found from the input ID, the result array will contain an error descriptor.

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters

**Request:**

    GET /api/messages?ids[]=53581bb1cca7800000522731&ids[]=53581bb1cca7800000522732&ids[]=123
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
        {
            objectType: "whatsup",
            _id: "53581bb1cca7800000522731",
            description: "I'm the content !",
            creator: 34556456,
            timestamps: {
              creation: 2354456547
            }
        },
        {
            objectType: "whatsup",
            _id: "53581bb1cca7800000522732",
            description: "I'm another content !",
            creator: 345564,
            timestamps: {
              creation: 23544564564
            }
        },
        {
            error: {
                status: 404,
                message: "Not Found",
                details: "The message 123 can not be found"
            }
        },
    ]

## POST /api/messages

Post a new message by the currently logged in user.

**Request Headers:**

- Content-Type: application/json

**Request JSON Object:**

- object: the definition of the object

  object: {
    objectType: "whatsup",             # Type of the message
    content: whatsup message content,  # Content of the message
  }

- targets: An array of targets

  targets: [{
    objectType: "activitystream",                                 # Type of the target
    id: "urn:linagora.com:activitystream:<activitystream uuid>",  # This is an activity stream id
  }]

**Status Codes:**

- 201 Created. With the _id of the new message.
- 400 Bad request. The current request is missing mandatory parameters
- 500 Internal server error: there was a problem.

**Request:**

    POST /api/messages
    Content-Type: application/json
    Host: localhost:8080

    {
        "object": {
            "objectType": "whatsupmessage",
            "content": "whatsup message content"
        },
        "targets": [
            {
                "objectType": "activitystream",
                "id": "urn:linagora:esn:activitystream:<activitystream uuid>"
            }
        ]
    }

**Response:**

    HTTP/1.1 201 Created
    {
        _id: '7f281054-e7a6-1547-012f-935d5b88389d'
    }

## POST /api/messages with inReplyTo parameter

Post a new comment in reply to a message, by the currently logged in user.

**Request Headers:**

- Content-Type: application/json

**Request JSON Object:**

- object: the definition of the object

  object: {
    objectType: "whatsup",             # Type of the message
    content: whatsup message content,  # Content of the message
  }

- inReplyTo: the definition of the parent message

  inReplyTo: {
    objectType: "whatsup",                                 # Type of the target
    id: "urn:linagora.com:whatsup:<whatsup uuid>",  # This is an activity stream id
  }

**Status Codes:**

- 201 Created. With the _id of the new comment.
- 400 Bad request. The current request is missing mandatory parameters
- 500 Internal server error: there was a problem.

**Request:**

    POST /api/messages
    Content-Type: application/json
    Host: localhost:8080

    {
        "object": {
            "objectType": "whatsup",
            "content": "comment message content"
        },
        "inReplyTo": {
                "objectType": "activitystream",
                "id": "urn:linagora:esn:whatsup:<whatsup uuid>"
        }
    }

**Response:**

    HTTP/1.1 201 Created
    {
        _id: '7f281054-e7a6-1547-012f-935d5b88389d',
        parentId: '7f281054-e7a6-1547-012f-935d5b883833'
    }