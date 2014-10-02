# /api/communities

Note: Communities titles are unique per domain.

## POST /api/communities

Create an ESN community in a domain. The creator of the community is the user which issue the request.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- title: The community title
- description: The community description
- domain_ids: The ids of the domain the communities is linked to.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 201 Created. The community has been created.
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The user is not authenticated on the platform.
- 409 Conflict. A community already exists with this title in the domain.

**Request:**

    POST /api/communities
    Accept: application/json
    Host: localhost:8080
    {
      "title": "Node.js",
      "description": "All about node.js",
      "domain_ids": ["83878920289838830309"]
    }

**Response:**

    HTTP/1.1 201 Created
    {
      "_id": "123456789"
      "title": "Node.js",
      "description": "All about node.js",
      "creator": "0987654321",
      "domain_ids": ["83878920289838830309"],
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

# POST /api/communities/{community_id}/avatar

Post a new avatar for the given community.

**Request query strings parameters**

- mimetype: the MIME type of the avatar. Valid values are 'image/png', 'image/gif' and 'image/jpeg'
- size: the size, in bytes, of the POSTed image. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.

**Request Body:**

This endpoint expects the request body to be the raw image data

- 200 OK. With the recorded image ID
- 400 Bad request. The current request is missing mandatory parameters
- 401 Unauthorized. The user is not authenticated on the platform.
- 412 Precondition failed. The number of bytes recoreded by the file storage service differs from the number of bytes given by the user agent
- 500 Internal server error: there was a problem, either storing the file, manipulating the image, or updating the user properties.

**Request:**

    POST /api/communities/123456789/avatar?mimetype=image%2Fpng&size=12345
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        _id: '9f888058-e9e6-4915-814b-935d5b88389d'
    }
    
# GET /api/communities/{community_id}/avatar

Get the community avatar.

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

- 200 Ok. With the stream of the image
- 304 Not modified. The image has not been changed since the last GET
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /api/communities/123456789/avatar
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT

## GET /api/communities

Get the communities list for a given domain. The list is ordered by community title.

**Request Headers:**

- Accept: application/json

**Query Parameters:**

- domain_id: The id of the domain to fetch communities from.
- creator: The id of the user who created the search communities.
- title: The title of a searched community. The title filter is case insensitive.

**Response Headers**

- Content-Length: Document size

**Response JSON Object:**

- An array of communities for the given domain.

**Status Codes:**

- 200 OK
- 400 Bad Request
- 401 Unauthorized. The user is not authenticated on the platform.
- 500 Internal server error: there was a problem whilst listing communities.

**Request:**

    GET /api/communities?domain_id=8292903883939282
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
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
     
## GET /api/communities/{community_id}

Get a community.

**Parameters**

- community_id: The community ID

**Request Headers:**

- Accept: application/json

**Response Headers**

- Content-Length: Document size

**Response JSON Object:**

- The community object

**Status Codes:**

- 200 OK
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user does not have read rights for the community: User may not belong to the domain the community is part of.

**Request:**

    GET /api/communities/123456789
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "123456789",
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
      }
    }

## DELETE /api/communities/{community_id}

Delete a community.

**Parameters**

- community_id: The community ID

**Request Headers:**

- Accept: application/json

**Status Codes:**

- 204 No content
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not delete the community: Only the community creator can delete the community.

**Request:**

    DELETE /api/communities/123456789
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No content

## GET /api/communities/{community_id}/members

List all users who are members of the community.

**Request Headers:**

- Accept: application/json

**Parameters:**

- community_id: The community id

**Query Parameters:**

- limit (int): The number of members to return. This will only keep the N first members (where N=limit). Default value is 50.
- offset (int): Start the list of members after skipping N members (where N=offset). For example, if the size of the members list is 100 and the offset is 50, the result list will contain only members from 50 to 99 (list index starts at index 0).

**Response Headers:**

- Content-Type: application/json
- X-ESN-Items-Count: The number of members in the community

**Response JSON Object**

Array of community members.

**Status Codes:**

- 200 OK
- 400 Bad request
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden - The user does not have enough rights to get the community members. 
- 404 Not found - Community or user not found. The error message will contain details.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    GET /api/communities/538e3bd6654d7c3307f990fa/members
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

## GET /api/communities/{community_id}/members/{user_id}

Check if a user is a member of the community.

**Request Headers:**

- Accept: application/json

**Parameters:**

- community_id: The community id
- user_id: The user_id to check community membership

**Response Headers:**

- Content-Type: application/json

**Status Codes:**

- 200 OK - Current user is a community member and user is a member.
- 400 Bad request.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden - The user does not have enough rights to get the community members. 
- 404 Not found - Current user is a community member and user is not a member
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    GET /api/communities/538e3bd6654d7c3307f990fa/members/538e3bd6654d7c3307f990fb
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "538e3bd6654d7c3307f990fb",
      "firstname": "John",
      "lastname": "Doe",
      "avatar": "9330-0393-7373-7280"
    }

## PUT /api/communities/{community_id}/members/{user_id}

Add the user to a community ie join the community.
Note that it does not have any effect if the user is already in the community.

**Request Headers:**

- Accept: application/json

**Parameters:**

- community_id: The community id
- user_id: The user id

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

No response.

**Status Codes:**

- 204 No content - User is now a member of the community.
- 400 Bad request.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden - The user can not join the community. 
- 404 Not found - Community or user not found. The error message will contain details.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    PUT /api/communities/538e3bd6654d7c3307f990fa/members/538e3bd6654d7c3307f990fb
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No Content


## DELETE /api/communities/{community_id}/members/{user_id}

Delete the user from a community i.e. leave the community.

Notes:
 
- The community creator can not leave the community.
- It does not have any effect if the user is not in the community.

**Request Headers:**

- Accept: application/json

**Parameters:**

- community_id: The community id
- user_id: The user id

**Response Headers:**

- Content-Type: application/json

**Response JSON Object**

No response.

**Status Codes:**

- 204 No content - User is no longer a community member.
- 400 Bad request.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden - The user can not leave the community. 
- 404 Not found - Community or user not found. The error message will contain details.
- 500 Internal server error - Something went wrong on the server side.

**Request:**

    DELETE /api/communities/538e3bd6654d7c3307f990fa/members/538e3bd6654d7c3307f990fb
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No Content

