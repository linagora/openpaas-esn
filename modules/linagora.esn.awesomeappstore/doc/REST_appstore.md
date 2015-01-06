# /appstore/api

Terminology:

- Submit an application: A developer want to submit an application to the appstore. He will achieve this by filling a form and uploading an archive.
- Deploy an application: A submitted application is approved and can be installed on domain/community once deployed.
- Undeploy an application: An application which has been previously deployed is removed from the app store.
- Install an application: An deployed application is installed by a manager on a domain/community and can be used by users
- Update an application: A developer submitted a new version of the application, the application has been validated and the new version can be used by users once the manager installs the updated version.
- Uninstall an application: An application which has been installed in a domain/community is removed. The application is still available in the app store.

Note: The current description does not handle the application states, validation, etc...

## GET /appstore/api/apps

Get the list of all applications.

The response contains the application status in the current community if specified :

- installed: true|false : The application is installed or not.
- update: true|false : There is a new available version of the application or not.

**Request Headers:**

- Accept: application/json

**Request Query**

- community: The community id

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the list of applications
- 400 Bad Request. Invalid request body or parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 403 Forbidden. The authenticated user is not a community or domain manager
- 500 Server Error.

**Request:**

    GET /appstore/api/apps?community=123456789
    Accept: application/json

**Response:**

    HTTP/1.1 200 OK
    X-Esn-Item-Count: 3

    [
      {
        "_id": "537efb2a078e20a54b21332d",
        "title": "Twitter",
        "version": "0.1",
        "description": "Send tweets from you activity stream",
        "installed": true,
        "update": true
      },
      {
        "_id": "537efb2a078e20a54b213333",
        "title": "Chat",
        "version": "1.0",
        "description": "Live chat in the community",
        "installed": true,
        "update": false
      },
      {
        "_id": "637efb2a078e20a54b213234",
        "title": "Doodle",
        "version": "0.9.1",
        "description": "Create Doodle in the community",
        "installed": false,
        "update": false
      },
    ]

## GET /appstore/api/apps/{id}

Get details of an application

**Request Headers:**

- Accept: application/json

**Request Parameters**

- id: The application id

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the community application
- 400 Bad Request. Invalid request body or parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not Found. The application was not found
- 500 Server Error.

**Request:**

    GET /appstore/api/apps/537efb2a078e20a54b21332d
    Accept: application/json

**Response:**

    HTTP/1.1 200 OK

    {
      "_id":"54896f28c89cae000038b8f8",
      "avatar":"",
      "title":"New Application",
      "description":"a pretty description",
      "__v":3,
      "schemaVersion":1,
      "targetInjections":[
        {
          "key":"communityPageRightPanel",
          "values":[
            {
              "directive":"albi-modeler-link",
              "_id":"54896f28c89cae000038b8f9",
              "attributes":[
                {
                  "name":"community",
                  "value":"community",
                  "_id":"54896f28c89cae000038b8fa"
                }
              ]
            }
          ]
        }
      ],
      "domainInjections":[ ],
      "timestamps":{
        "creation":"2014-12-11T10:17:12.801Z"
      },
      "deployments":[
        {
          "target":{
            "objectType":"domain",
            "id":"54857e68eca9bfe373b76790"
          },
          "version":"1.0.0",
          "timestamps":{
            "creation":"2014-12-11T10:17:38.021Z"
          },
          "installs":[
            {
              "objectType":"community",
              "id":"54896eedc89cae000038b8f6"
            }
          ],
          "state":"submit"
        }
      ],
      "artifacts":[
        {
          "id":"df9a7080-811e-11e4-9e1b-e7a0d5819c5c",
          "version":"1.0.0",
          "timestamps":{
            "creation":"2014-12-11T10:17:12.981Z"
          }
        }
      ]
    }

## DELETE /appstore/api/apps/{id}

Remove an application from the app store, it will also delete every files (avatar, artifacts) related to this application.

**Request Headers:**

- Accept: application/json

**Request Parameters**

- id: The application id

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. The application is removed
- 400 Bad Request. Invalid request body or parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not Found. The application was not found
- 500 Server Error.

**Request:**

    DELETE /appstore/api/apps/537efb2a078e20a54b21332d
    Accept: application/json

**Response:**

    HTTP/1.1 200 OK

## POST /appstore/api/apps

Create an new application and store it.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- the new application object

**Response Headers:**

- Content-Length: Document size

**Response JSON Object:**

The id of the new message in the '_id' property.

**Status Codes:**

- 201 Created. The application has been created.
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not create the application (not a community manager).
- 500 Server Error.

**Request:**

    POST /appstore/api/apps
    Accept: application/json
    Host: localhost:8080
    {
      "title": "title",
      "description": "test description"
    }

**Response:**

    HTTP/1.1 201 Ok
    {
      "_id": "637efb2a078e20a54b213234"
    }

## PUT /appstore/api/apps/{id}

Update properties of an application

**Request Headers:**

- Accept: application/json

**Request Parameters**

- id: The application id

**Request JSON Object:**

- the new application object or properties to update

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 200 Ok. The application has been updated
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not update the application (not a community manager).
- 404 Not Found. The application was not found
- 500 Server Error.

**Request:**

    PUT /appstore/api/apps/537efb2a078e20a54b21332d
    Accept: application/json
    Host: localhost:8080
    {
      "title": "a new title"
    }

**Response:**

    HTTP/1.1 200 Ok

## GET /appstore/api/apps/{id}/avatar

Get the application avatar as image

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
- 400 Bad Request. Invalid request body or parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /appstore/api/apps/537efb2a078e20a54b21332d/avatar
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT

## POST /appstore/api/apps/{id}/avatar

Upload an avatar for the application

**Request query strings parameters**

- mimetype: the MIME type of the image. Valid values are 'image/png', 'image/gif' and 'image/jpeg'
- size: the size, in bytes, of the POSTed image. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.

**Request Body:**

This endpoint expects the request body to be the raw image data

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response JSON Object:**

The id of the new avatar in the '_id' property.

**Status Codes:**

- 201 Created. With the recorded image ID
- 400 Bad request. The current request is missing mandatory parameters
- 412 Precondition failed. The number of bytes recoreded by the file storage service differs from the number of bytes given by the user agent
- 500 Internal server error: there was a problem, either storing the file, manipulating the image, or updating the user properties.

**Request:**

    POST /appstore/api/apps/537efb2a078e20a54b21332d/avatar?mimetype=image%2Fpng&size=12345
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        _id: '9f888058-e9e6-4915-814b-935d5b88389d'
    }

## GET /appstore/api/apps/{id}/artifact/:artifactId

Get the application artifact related to artifactId

**Request Headers:**

- Accept: application/json

**Request Parameters:**

- artifactId: the id of the artifact

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 Ok. With the stream of the artifact
- 304 Not modified. The avatar has not been changed since the last GET
- 400 Bad request. The current request is missing mandatory parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /appstore/api/apps/537efb2a078e20a54b21332d/artifact/537efb2a078e20a541234567
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok

## POST /appstore/api/apps/{id}/artifact

Upload a new application artifact

**Request query strings parameters**

- mimetype: the MIME type of the artifact. Valid values are 'application/zip', // TODO ???
- size: the size, in bytes, of the POSTed artifact. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.
- version: the version of the artifact.

**Request Body:**

This endpoint expects the request body to be the raw image data

**Status Codes:**

- 200 Ok. With the recorded image ID
- 400 Bad request. The current request is missing mandatory parameters
- 412 Precondition failed. The number of bytes recoreded by the file storage service differs from the number of bytes given by the user agent
- 500 Internal server error: there was a problem, either storing the file, manipulating the image, or updating the user properties.

**Response Body:**

- _id: the id of the new stored artifact.

**Request:**

    POST /appstore/api/apps/537efb2a078e20a54b21332d/artifact?mimetype=application%2Fzip&size=12345&version=1.0.0
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    {
        _id: '9f888058-e9e6-4915-814b-935d5b88389d'
    }

## PUT /appstore/api/apps/{id}/deploy

Deploy a new application to a specified target with a specified version.
For now, this API only accepts 'domain' as the objectType.

**Request Body:**

- target: a tuple which describes the community/project in which the application is deployed and available.
- version: the version of the application we want to deploy

**Status Codes:**

- 204 No Content. The application is deployed
- 400 Bad request. The current request is missing mandatory parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error.

**Request:**

    PUT /appstore/api/apps/537efb2a078e20a54b21332d/deploy
    Accept: application/json
    Host: localhost:8080
    {
      "target": {
        "objectType": "domain",
        "id": "9f888058-e9e6-4915-814b-935d5b88389d"
      },
      "version": "1.0.0"
    }

**Response:**

    HTTP/1.1 204 No Content

## PUT /appstore/api/apps/{id}/undeploy

Undeploy an application of a specifif target described in the request body.

**Request Body:**

- a tuple which describes the community/project in which the application will be undeployed

**Status Codes:**

- 204 No Content. The application is undeployed
- 400 Bad request. The current request is missing mandatory parameters
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error.

**Request:**

    PUT /appstore/api/apps/537efb2a078e20a54b21332d/undeploy
    Accept: application/json
    Host: localhost:8080
    {
      "objectType": "domain",
      "id": "9f888058-e9e6-4915-814b-935d5b88389d"
    }

**Response:**

    HTTP/1.1 204 No Content

## PUT /appstore/api/apps/{id}/updeploy

Deploy a new version of the application

// TODO

## PUT /appstore/api/apps/{id}/install

Install an application in a target described in the request body.
For now, this API only install into communities.

**Request Headers:**

- Accept: application/json

**Request body**

- a tuple which describes the community/project in which the application will be installed

**Request JSON Object:**

- objectType: the type of the object
- id: The community id

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 204 No Content. The application has been installed
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not install the application (not a community manager).

**Request:**

    PUT /appstore/api/apps/537efb2a078e20a54b21332d/install
    Accept: application/json
    Host: localhost:8080
    {
      "objectType": "community",
      "id": "637efb2a078e20a54b213234"
    }

**Response:**

    HTTP/1.1 204 No Content

## PUT /appstore/api/apps/{id}/uninstall

Uninstall an application of a specific target.

**Request Headers:**

- Accept: application/json

**Request body**

- a tuple which describes the community/project in which the application will be uninstalled

**Request JSON Object:**

- objectType: the type of the object
- id: The community id

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 204 No Content. The application has been uninstalled
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not uninstall the application (not a community manager).

**Request:**

    PUT /appstore/api/apps/537efb2a078e20a54b21332d/uninstall
    Accept: application/json
    Host: localhost:8080
    {
      "objectType": "community",
      "id": "637efb2a078e20a54b213234"
    }

**Response:**

    HTTP/1.1 204 No Content
