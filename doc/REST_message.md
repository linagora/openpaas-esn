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

## COPY /api/messages

Copy a message from a resource (community, project, ...) to another (or several others).

**Query Parameters:**

- id : Identifiers of the message to copy.

**Request Headers:**

- Content-Type: application/json

**Request JSON Object:**

- resource: identify the source community/project of the original message

```
  resource: {
    objectType: "activitystream",           # Type of the resource
    id: 123456798,                     # The id of the resource
  }
```

- targets: An array of targets where the message will be copied

```
  targets: [{
    objectType: "activitystream",           # Type of the target
    id: "123456798",
  }]
```

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

The id of the new message in the '_id' property.

**Status Codes:**

- 201 Created. With the _id of the new message.
- 400 Bad request. The current request is missing mandatory parameters
- 403 Unauthorized. The current user is not authorized to copy message to the specified target(s)
- 404 Not found. The message related to the request parameter id does not exist
- 500 Internal server error: there was a problem.

**Request:**

    COPY /api/messages/53581bb1cca7800000522731
    Content-Type: application/json
    Host: localhost:8080
    {
      "resource": { "objecType": "activitystream", "id": "7fd3e254-394f-46eb-994d-a2ec23e7cf27" },
      "targets": [
        {"objectType": "activitystream", "id": "976f55e7-b72f-4ac0-afb2-400a85c50951" }
      ]
    }

**Response:**

    HTTP/1.1 201 Created
    {
        _id: '53581bb1cca7800000522852'
    }

## POST /api/messages

Post a new message by the currently logged in user.

**Request Headers:**

- Content-Type: application/json

**Request JSON Object:**

- object: the definition of the object

```
    object: {
      objectType: "whatsup",               # Type of the message
      content: "whatsup message content",  # Content of the message
      attachments: [                       # Message attachments
        {_id: "9829892-9982982-87222-238388", name: "chuck.png", contentType: "image/png", length: 988288},
        {_id: "9829892-9982982-87222-238388", name: "bruce.png", contentType: "image/png", length: 67392}
      ],
      parsers: [
        {name: "markdown"}
      ]
    }
```

- targets: An array of targets

```
  targets: [{
    objectType: "activitystream",                                 # Type of the target
    id: "urn:linagora.com:activitystream:<activitystream uuid>",  # This is an activity stream id
  }]
```

**Status Codes:**

- 201 Created. With the _id of the new message.
- 400 Bad request. The current request is missing mandatory parameters
- 403 Unauthorized. The current user is not authorized to post message to the specified target(s)
- 500 Internal server error: there was a problem.

**Request:**

    POST /api/messages
    Content-Type: application/json
    Host: localhost:8080

    {
        "object": {
            "objectType": "whatsup",
            "description": "whatsup message content",
            "attachments": [
                {"_id": "9829892-9982982-87222-238388", "name": "chuck.png", "contentType": "image/png", "length": 988288},
                {"_id": "9829892-9982982-87222-238388", "name": "bruce.png", "contentType": "image/png", "length": 67392}
            ],
            parsers: [
                {name: "markdown"}
            ]
        },
        "targets": [
            {
                "objectType": "activitystream",
                "id": "<activitystream uuid>"
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

```
  object: {
    objectType: "whatsup",             # Type of the message
    content: whatsup message content,  # Content of the message
  }
```

- inReplyTo: the definition of the parent message

```
  inReplyTo: {
    objectType: "whatsup",                                 # Type of the target
    id: "urn:linagora.com:whatsup:<whatsup uuid>",  # This is an activity stream id
  }
```

**Status Codes:**

- 201 Created. With the _id of the new comment.
- 400 Bad request. The current request is missing mandatory parameters
- 403 Unauthorized. The current user is not authorized to reply to the specified message
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
    
## POST /api/messages/email

Publish a message in rfc822 MIME form.

**Request Headers:**

- Content-Type: message/rfc822

**Query Parameters:**

- id: ID of the target
- objectType: Type of the target

**Request text:**

An email in rfc822 MIME format.

**Status Codes:**

- 201 Created. With the id of the new message.
- 400 Bad request. The current request is missing mandatory parameters
- 500 Internal server error.

**Request:**

    POST /api/messages/email?id=7aea8933-0a55-4e34-81ae-ec9812b8f891&objectType=activitystream
    Content-Type: message/rfc822
    Host: localhost:8080

    From: 'Sender Name' <sender@example.com>
    To: 'Receiver Name' <receiver@example.com>
    Subject: Hello world!
    
    How are you today?

**Response:**

    HTTP/1.1 201 Created
    {
        _id: '7f281054935d5b88389d'
    }
