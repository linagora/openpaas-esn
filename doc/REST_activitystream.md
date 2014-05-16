# /api/activitystreams

# GET /api/activitystreams/{uuid}

Get the timeline of an activity stream from its uuid.

**Parameters:**

- uuid: The identifier of the activity stream.

**Query Parameters:**

- before (string): Determines the last activity ID of the stream.
- limit (int): The maximum number of activities to include in the stream.

**Request Headers:**

- Accept: application/json

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
