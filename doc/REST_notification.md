# /api/notifications

# Attributes

**title**: Notification title.

**author**: The user who created the notification.

**action**: Notification action

**subject**: Notification subject

**link:**: An HTTP link to the resource involved in the notification.

**target:** Array of notification recipient.

**level**: The notification level: transient, persistant, information.

**read**: The notification has been read by the recipient.

**created_at**: When the notification has been created (default is Date.now())

**data**: Notification specific data. Each notification handler may be able to get data and provide a way to handle/process this data.

# Use case

An external application may be able to publish notifications into the platform in order to notify users about current state.

1. User A launches the external application
2. User A authenticate the external application using OpenPaaS authentication mechanism
3. User A creates a resource on the external application. The user wants to notify other users about this new resource.
4. The application sends a notification to OpenPaaS like:

    {
      "title": "New form",
      "action": "created",
      "object": "form",
      "link": "http://localhost:3000/form/123456789",
      "level": "transient",
      "target": ["userB", "userC", "userD"]
    }

Which means that current logged in user created a form which is available on http://localhost:3000/form/123456789.
Users B, C and D will receive the notification (up to the platform to deliver the notification the right way).

## POST /api/notifications

Publish a new notification. If the target contains multiple elements, the platform will create as many notification as there are elements in the array plus the initial one.

**Request Headers:**

- Accept: application/json

**Request Body:**

A notification as JSON. The target is an array of notification recipient.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 201 Created. The body contains the array of created notifications.

**Request:**

    POST /api/notifications
    Accept: application/json
    Host: localhost:8080
    
    {
      title: 'My notification',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      author: 53a946c41f6d7a5d729e0477,
      target: [ 53a946c41f6d7a5d729e0478, 53a946c41f6d7a5d729e0479 ],
      read: false,
      timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
      level: 'info'
    }

**Response:**

    HTTP/1.1 201 Created
    [
      {
        title: 'My notification',
        action: 'create',
        object: 'form',
        link: 'http://localhost:8888',
        author: 53a946c41f6d7a5d729e0477,
        _id: 53a946c41f6d7a5d729e047f,
        __v: 0,
        target: [ 53a946c41f6d7a5d729e0478, 53a946c41f6d7a5d729e0479 ],
        read: false,
        timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
        level: 'info'
      },
      {
        parent: 53a946c41f6d7a5d729e047f,
        title: 'My notification',
        author: 53a946c41f6d7a5d729e0477,
        action: 'create',
        object: 'form',
        link: 'http://localhost:8888',
        _id: 53a946c41f6d7a5d729e0480,
        __v: 0,
        target: [ 53a946c41f6d7a5d729e0478 ],
        read: false,
        timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
        level: 'info'
      },
      {
        parent: 53a946c41f6d7a5d729e047f,
        title: 'My notification',
        author: 53a946c41f6d7a5d729e0477,
        action: 'create',
        object: 'form',
        link: 'http://localhost:8888',
        _id: 53a946c41f6d7a5d729e0481,
        __v: 0,
        target: [ 53a946c41f6d7a5d729e0479 ],
        read: false,
        timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
        level: 'info'
      }
    ]

## GET /api/notifications

List all the notifications where the target is the current user.

**Request Headers:**

- Accept: application/json

**Request Attributes:**

- read=(true, false, all): Include notifications which have been read or not or all.

**Response Headers:**

- Content-Length: Document size

**Status Codes:**

- 200 OK.

**Request:**

    GET /api/notifications?read=all
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    [
      {
        "_id": "9292938883883993929",
        "author": "937887399292838838",
        "read": "true",
        "title": "New form",
        "action": "created",
        "object": "form",
        "link": "http://localhost:3000/form/123456789",
        "level": "transient",
        "target": ["userB", "userC", "userD"]
      },
      {
        "_id": "9292938883883993930",
        "author": "937887399292838838",
        "read": "false",
        "title": "New result",
        "action": "filled",
        "object": "form",
        "link": "http://localhost:3000/form/123456789",
        "level": "transient",
        "target": ["userA"]
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
      "_id": "9292938883883993929",
      "author": "937887399292838838",
      "read": "true",
      "title": "New result",
      "action": "filled",
      "object": "form",
      "link": "http://localhost:3000/form/123456789",
      "level": "transient",
      "target": ["userA"]
    }

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
- 403 Forbidden. Current user is not authorized to set the notification as read (not creator).

**Request:**

    PUT /api/notifications
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 205 Reset Content
