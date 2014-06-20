# /api/notifications

OpenPaas notifications are linked to platform/user resources.

- Users may be able to subscribe to resources and so receive notifications on 'resource state change'.
- Users may also receive notifications from resources they are involved in: created, mention, assignment, ...

# Attributes

**type**: Notifications contain 'type' which correspond to events that trigger the notification. Based on the 'type', the platform is then able to handle each notification independently:

- subscribed: The user explicitely subscribed to a resource.
- author: The user is the resource creator.
- ...

**read**: The notification has been read by the recipient.

**created_at**: When the notification has been created (default is Date.now())

**resource**: The resource the notification is about. For example, we may have a new notification when an application is creating a resource.

**data**: Resource specific data. Each notification handler may be able to get data and provide a way to handle/process this data.

## GET /api/notifications

List all the notifications of the current user.

**Request Headers:**

- Accept: application/json

**Request Attributes:**

- ids[]: Filter the list of notifications to get.
- read: Include read notifications.
- Filters to be defined.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 200 OK.

**Request:**

    GET /api/notifications?read=true
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "_id": "9292938883883993929"
        "read": "false",
        "type": "subscribed",
        "resource": {
          "_id": "983908308303093092",
          "type": "application"
        },
        "data": {
          "state": "create",
          "target": {
            "_id": "9098833993993002",
            "type": "form"
          }
        }
      }
    ]

## GET /api/notifications/{id}

Get a single notification from its ID even if it has been read.

**Request Headers:**

- Accept: application/json

**Parameters:**

- id: The notification ID.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 200 OK.

**Request:**

    GET /api/notifications/9292938883883993929
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
      "_id": "9292938883883993929"
      "read": "false",
      "type": "subscribed",
      "resource": {
        "_id": "983908308303093092",
        "type": "application"
      },
      "data": {
        "state": "create",
        "target": {
          "_id": "9098833993993002",
          "type": "form"
        }
      }
    }

## GET /api/resource/{id}/notifications

Get the notifications of the given platform resource (resource is not fixed, it is a resource name).

**Request Headers:**

- Accept: application/json

**Request Attributes:**

- ids[]: Filter the list of notifications to get.
- read: Include read notifications.
- Filters to be defined.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 200 OK.

**Request:**

    GET /api/application/9292938883883993929/notifications
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "_id": "93939988882910003848",
        "read": "false",
        ...
      },
      {
        "_id": "93939988882910003849",
        "read": "false"
        ...
      }
    ]


## POST /api/resource/{id}/notifications

Creates a notification on a resource.

**Request Headers:**

- Accept: application/json

**Parameters**:

- id: The resource ID.

**Request JSON Object:**

- data: The notification data.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 201 Created. The notification has been created.
- 400 Bad Request. Invalid request body or parameters

**Request:**

    POST /api/application/030933884848/notifications
    Accept: application/json
    Host: localhost:8080
    {
        "data": {
            "state": "create",
            "target": {
                "_id": "9098833993993002",
                "type": "form"
            }
        }
    }

**Response:**

    HTTP/1.1 201 Created

## PUT /api/notifications

Mark one or more notifications as read. When used with the last_read_at parameter, mark all the notifications before the date as read, keep newer ones as unread.

**Request Headers:**

- Accept: application/json

**Request Attributes:**

- last_read_at: Timestamp of the last read notification. If not set, default is Date.now().
- ids[]: The ids of the notifications to set as read.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 205 Reset Content. The notification(s) has been marked as read.

**Request:**

    PUT /api/notifications
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 205 Reset Content
