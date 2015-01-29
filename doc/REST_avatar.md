# /api/avatars

## GET /api/avatars

Retrieve avatar of a resource.

**Request Headers:**

- Accept: application/json
- If-Modified-Since: Date

**Query Parameters:**

- objectType: The resource type to retrieve avatar from. Possible values are 'user', 'community' and 'image'
- email: If objectType is user, the parameter value must be an email
- id: If objectType is community, the parameter value is the id of the community. If the object type is image, the id is the image id.
- format: If format is set to 'original', send back the original avatar which has been uploaded, else send back the 128px x 128px one.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json
- Last-Modified: Date

**Status Codes:**

- 200 Ok. With the stream of the avatar if found or a default avatar
- 304 Not modified. The avatar has not been changed since the last GET
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication
- 404 Not found.
- 500 Internal server error: there was a problem with recovering the file.

**Request:**

    GET /api/avatars?objectType=user&email=user@openpaas.org
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT
    
    
**Request:**

    GET /api/avatars?objectType=community&id=98298298208072772
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 Ok
    Last-Modified: Wed, 18 Dec 2013 14:51:51 GMT