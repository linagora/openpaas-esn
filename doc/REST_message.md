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
