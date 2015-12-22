# /api/calendars

## POST /api/calendars/{objectType}/{calendarId}/events

Create a calendar event (called by the CalDAV server).

Note: A new event message is created in the activity stream of the collaboration.

**Request Headers:**

- Accept: application/json

**Request URL Parameters:**

- objectType: The type of collaboration (community, project)
- calendarId: The calendar id (must match with a collaboration object)

**Request JSON Object:**

- event_id: The identifier to the event, usually the caldav relative path.
- type:
    * created
    * updated (not yet implemented)
    * removed (not yet implemented)
- event: String which contains a calendar event in ICS format
- old_event: The old event in ICS format (only on modification)

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

    POST /api/calendars/project/543e895096adb12053eaa64c/events
    Accept: application/json
    Host: localhost:8080
    {
        "event_id": "/calendars/543e895096adb12053eaa64c/events/123123.ics",
        "type": "created",
        "event": "BEGIN:VCALENDAR..."
    }

**Response:**

    HTTP/1.1 201 Created
    {
        "_id": "543e99a9c2e9f055718e7d92",
        "objectType": "event"
    }

## POST /api/calendars/inviteattendees

Create notification for specified attendees (called by the CalDAV server).

Note: It send user notification and email to attendees if notify is set to true.

**Request Headers:**

- Content-Type: application/json

**Request JSON Object:**

- emails: an array of emails of the invited attendees
- notify: whether to notify the attendee or not
- method: the method of the ICS (REQUEST, CANCEL, REPLY, etc.)
- event: String which contains a calendar event in ICS format

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK.
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 500 Internal server error.


**Request:**

    POST /api/calendars/inviteattendees
    Content-Type: application/json
    Host: localhost:8080
    {
      "emails": [ "user1@open-paas.org", "user2@open-paas.org" ],
      "notify": "true",
      "method": "REQUEST",
      "event": "BEGIN:VCALENDAR..."
    }

**Response:**

    HTTP/1.1 200 OK

## GET /api/calendars/event/participation

Update the attendee participation to an event (used by links in invitation emails).


**Request URL Parameters:**

- jwt: a JWT holding the participation change data : event as jcal, organizerEmail, attendeeEmail, calendarId, action

**Status Codes:**

- 200 OK.
- 400 Bad Request. Invalid request parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 500 Internal server error.


**Request:**

    GET /api/calendars/event/participation?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaXBvIjpbIjEyMzQ1Njc4OTAiXX0.E6QGuuqelyf0RsEicnsQCDteSAij0KRb7GOQIouFm9A
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
