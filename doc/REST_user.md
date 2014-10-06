# /api/user

## GET /api/user

Get a the authenticated user information.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication

**Request:**

    GET /api/user
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
        _id: 123456789,
        firstname: "John",
        lastname: "Doe",
        emails: ["johndoe@linagora.com"]
    }

# GET /api/user/profile

Get the current user profile.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile as JSON.
- 401 Unauthorized.

**Request:**

    GET /api/user/profile
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK

    {
      "firstname": "John",
      "lastname": "Doe",
      "job_title": "Manager",
      "service": "Sales",
      "phone": "+33467455653222"
    }

# PUT /api/user/profile/{attribute_name}

Update an element of the current user profile.

**Parameters**

- attribute_name: The attribute name of the element to update (firstname, lastname, ...)

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- value: The attribute value.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. The profile element has been updated.
- 400 Bad Request.
- 401 Unauthorized. The current user does not have rights to update the user profile

**Request:**

    PUT /api/user/profile/firstname
    Accept: application/json
    Host: localhost:8080

    {value: 'Johnny'}

**Response:**

    HTTP/1.1 200 OK

## POST /api/user/profile/avatar

Post a new avatar for the currently logged in user. The posted avatar is set as the default avatar for the user. The image should be a square, and at least be 128x128 px.

**Request query strings parameters**

- mimetype: the MIME type of the image. Valid values are 'image/png', 'image/gif' and 'image/jpeg'
- size: the size, in bytes, of the POSTed image. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.

**Request Body:**

This endpoint expects the request body to be the raw image data

- 200 Ok. With the recorded image ID
- 400 Bad request. The current request is missing mandatory parameters
- 412 Precondition failed. The number of bytes recoreded by the file storage service differs from the number of bytes given by the user agent
- 500 Internal server error: there was a problem, either storing the file, manipulating the image, or updating the user properties.

**Request:**

    POST /api/user/profile/avatar?mimetype=image%2Fpng&size=12345
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        _id: '9f888058-e9e6-4915-814b-935d5b88389d'
    }

## GET /api/user/profile/avatar

Get the avatar for the currently logged in user.

**Request Headers:**

- Accept: application/json
- If-Modified-Since: Date

**Query Parameters:**

- format: The avatar format. If not specified, it returns the avatar in 128x128 px. If format=original, returns the original uploaded file.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json
- Last-Modified: Date

**Status Codes:**

- 200 Ok. With the stream of the avatar
- 304 Not modified. The avatar has not been changed since the last GET
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /api/user/profile/avatar
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT

## GET /api/user/communities

List all of the communities across all of the domains to which the authenticated user belongs.
Check [./REST_community.md](Community API) for more details on communities.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

An array of community objects the current user belongs to.

**Status Codes:**

- 200 OK
- 400 Bad request
- 500 Internal server error - Something went bad on the server side.

**Request:**

    GET /api/user/communities
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "_id": "987654321",
        "title": "Mean",
        "description": "The Awesome MEAN stack",
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
    ]

## GET /api/user/activitystreams

Get all the activity streams of the current user.

**Request Headers:**

- Accept: application/json

**Request Query Strings Parameters:**

- domainid : Optional identifier of the domain in which to get the communities activity streams.

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

An array of activity streams objects which can be read by the current user.

**Status Codes:**

- 200 OK
- 400 Bad request
- 401 Unauthorized
- 500 Internal server error

**Request:**

    GET /api/user/activitystreams
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "uuid": "7aea8933-0a55-4e34-81ae-ec9812b8f891",
        "target": {
          "objectType": "domain",
          "displayName": "rse",
          "_id": "5375de4bd684db7f6fbd4f98",
          "id": "urn:linagora.com:domain:5375de4bd684db7f6fbd4f98",
          "image": ""
        }
      },
      {
        "uuid": "99363b89-b2d7-4eb7-872e-60c9909c5fb5",
        "target": {
          "objectType": "community",
          "displayName": "node.js",
          "_id": "53d76548974d22d21c9f249f",
          "id": "urn:linagora.com:community:53d76548974d22d21c9f249f",
          "image": "576875a0-1700-11e4-8141-013370dbdb36"
        }
      }
    ]

**Request:**

    GET /api/user/activitystreams?domainid=5375de4bd684db7f6fbd4f98
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "uuid": "99363b89-b2d7-4eb7-872e-60c9909c5fb5",
        "target": {
          "objectType": "community",
          "displayName": "node.js",
          "_id": "53d76548974d22d21c9f249f",
          "id": "urn:linagora.com:community:53d76548974d22d21c9f249f",
          "image": "576875a0-1700-11e4-8141-013370dbdb36"
        }
      }
    ]

## GET /api/user/oauth/clients

List all of the OAuth clients created by the current user.
Check [./REST_OAuth.md](OAuth API) for more details on OAuth support.

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

An array of OAuth clients the current user created.

**Status Codes:**

- 200 OK
- 400 Bad request
- 500 Internal server error - Something went bad on the server side.

**Request:**

    GET /api/user/oauth/clients
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "_id":"54189f0c5375449a5d17f3d9",
        "clientSecret":"OwISwURuiJ1KhBgRIgPdQNbMzyIpA9AEyuHTCRQH",
        "clientId":"t0m0s3SS1cDLEVBK7pvL",
        "name":"Twitter Streaming App",
        "redirectUri":"http://twitter.com/oauth/",
        "description":"Let's stream tweets",
        "creator":"5375de9fd684db7f6fbd5010",
        "__v":0,
        "schemaVersion":1,
        "created":"2014-09-16T20:35:24.643Z"
      }
    ]

## PUT /api/user/notifications/:uuid/read

Mark the user notification of id :uuid as read.

**Request Headers:**

- Accept: application/json

**Request Body:**

This endpoint expects the request body to be either 'true' or 'false'.

**Response Headers:**

- Content-Type: application/json

**Status Codes:**

- 204 No Content
- 400 Bad request
- 401 Unauthorized
- 404 Not found
- 500 Internal server error

**Request:**

    PUT /api/user/notifications/1234567589/read
    Accept: application/json
    Host: localhost:8080

        true

**Response:**

    HTTP/1.1 204 OK