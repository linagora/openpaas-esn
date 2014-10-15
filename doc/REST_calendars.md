# /api/calendars

## POST /api/calendars/{calendar_id}/events

Create a calendar event (called by the CalDAV server).

Note: A new event message is created in the community activity stream.

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- calendar_id: the calendar id (must match with a community id)

**Request JSON Object:**

- event_id: the event id
- type:
    * created
    * updated (not implemented)
    * removed (not implemented)
- event: string which contains a calendar event in ICS format
- old_event: the old event in ICS format

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 201 Created.
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 404 Not Found. The calendar id parameter is not a community id.
- 500 Internal server error.


**Request:**

    POST /api/calendars/543e895096adb12053eaa64c/events
    Accept: application/json
    Host: localhost:8080
    {
        "event_id": "123",
        "type": "created",
        "event": "ICS"
    }

**Response:**

    HTTP/1.1 201 Created
    {
        "_id": "543e99a9c2e9f055718e7d92"
    }
