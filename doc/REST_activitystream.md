# /api/activitystreams

## GET /api/activitystreams/{uuid}

Get the timeline of an activity stream from its uuid.

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- uuid: The identifier of the activity stream.

**Query Parameters:**

- before (string): Determines the last activity ID of the stream. (optional, this is the default)
- after (string): Determines the previous activity ID of the stream.
- limit (int): The maximum number of activities to include in the stream. (optional)

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

Array of activities.

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. The activity stream has not been found.

**Request:**

    GET /api/activitystreams/7389992882
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "verb": “post”,
        "language": "en"
        "published": "2014-04-16T12:51:52.268Z",
        "actor": {
          "_id": "53579744ac7d77000003f660",
          "objectType": “user”,
          "id": “urn:linagora.com:user:53579744ac7d77000003f660”,
          "image": "58514110-cb27-11e3-9ecf-eda394093a53",
          "displayName": "Foo Bar"
        },
        "object": {
          "_id": "53579744ac7d77000003f777",
          "objectType": “whatsup”,
          "id": “urn:linagora.com:whatsup:53579744ac7d77000003f777”
        },
        "target": [
          {
            "_id": "53579744ac7d77000003f888",
            "objectType": “domain”,
            "id": “urn:linagora.com:domain:53579744ac7d77000003f888”
          }
        ]
      },
      {
        "verb: “post”,
        "language": "en"
        "published": "2014-04-16T12:50:32.345Z",
        "actor": {
          "_id": "53579744ac7d77000003f660",
          "objectType": “user”,
          "id": “urn:linagora.com:user:53579744ac7d77000003f660”,
          "image": "58514110-cb27-11e3-9ecf-eda394093a53",
          "displayName": "Foo Bar"
        },
        "object": {
          "_id": "53579744ac7d77000003f778",
          "objectType": “whatsup”,
          "id": “urn:linagora.com:whatsup:53579744ac7d77000003f778”
        },
        "target": [
          {
            "_id": "53579744ac7d77000003f888",
            "objectType": “domain”,
            "id": “urn:linagora.com:domain:53579744ac7d77000003f888”
          }
        ]
      }
    ]

## GET /api/activitystreams/{uuid}/unreadcount

Get the number of unreads timeline entries of an activity stream from its uuid for the current user.

The last timeline entry read is updated each time `GET /api/activitystreams/{uuid}` is send.

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- uuid: The identifier of the activity stream.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

- _id: the activity stream uuid
- unread_count: number of unread timeline entries

**Status Codes:**

- 200 Ok.
- 400 Bad Request. Invalid request body or parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 404 Not Found. The activity stream has not been found.
- 500 Internal server error.

**Request:**

    GET /api/activitystreams/7389992882/unreadcount
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
      "_id": "7389992882",
      "unread_count": "4"
    }

## GET /api/activitystreams/{uuid}/resource

Get the resource associated with the activitystream

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- uuid: The identifier of the activity stream.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

The resource associated to an acitivty stream. For now it can only be a collaboration

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. The activity stream resource has not been found.

**Request:**

    GET /api/activitystreams/7389992882/resource
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      objectType: "community",
      object: {
          "_id": "123456789"
          "title": "Node.js",
          "description": "All about node.js",
          "creator": "0987654321",
          "domain_ids": ["83878920289838830309"],
          "timestamps": {
            "creation": "2014-05-16T09:47:11.703Z"
          },
          activity_stream: {
            uuid: "7389992882",
            "timestamps": {
              "creation": "2014-05-16T09:47:11.704Z"
            }
          }
      }
    }