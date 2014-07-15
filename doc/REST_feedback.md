# /api/feedback

## POST /api/feedback

Create a new feedback.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Request JSON Object:**

- feedback: The feedback content.

**Status Codes:**

- 201 Created. With the document stored.
- 400 Bad request. The request JSON Object is `null` or the `feedback` field is empty (`null` or empty string).
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.

**Request:**

    POST /api/feedback
    Accept: application/json
    Host: localhost:8080

    {"content":"I love feedback !"}

**Response:**

    HTTP/1.1 201 Created
    {
      "__v":0,
      "content":"I love feedback !",
      "author":"538d8cd99f4e7e271e082b36",
      "_id":"53c65a8ab50020db3430745d",
      "published":"2014-07-16T10:57:14.675Z"
    }
