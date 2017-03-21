# Permissions in calendar module

## Calendars

A calendar can be shared as a:

   * **Public calendar:** every user can access the calendar
   * **Shared calendar:** the owner can delegate its calendars to other users. 
 
It is worth mentioning the technical difference between the two implementations: a public calendar has only one instance in the database which is physically shared by all user. On the other hand, shared calendars are implementing by providing a new instance for each delegated user with the corresponding permission.

Technically speaking, sabre leverage ACL based on the [RFC3744](https://www.ietf.org/rfc/rfc3744.txt) so as to manage both Public/Shared calendars. On the one hand, public calendars are implemented directly by a combination of ACL. On the other hand, Shared calendars are implemented by SharedCalendar objects that extends ACL. Indeed, sabre uses the [CalDAV-Sharing extension](https://github.com/apple/ccs-calendarserver/blob/master/doc/Extensions/caldav-sharing.txt) to share CalDAV. Having said so, developers should always keep in mind that both type of calendars are implemented from ACL.

To understand well how it works we need to understand how on Sabre side the permissions work. To manage permissions WebDAV uses ACL based on the [RFC3744](https://www.ietf.org/rfc/rfc3744.txt). Sabre uses the [CalDAV-Sharing extension](https://github.com/apple/ccs-calendarserver/blob/master/doc/Extensions/caldav-sharing.txt) to share CalDAV.

### Public Calendars

This are the differents rights for a public calendar. Each public calendar rights can be an aggregation of rights:

   * **Private:** none
   * **Read:** {dav:}read
   * **Write:** {dav:}read, {dav:}write

### Shared Calendars

The CalDAV-Sharing extension describes only 2 shareable rights : read, read-write. As we needed to add new roles (free-busy, administrator) for calendars, we extended the CalDAV-Sharing extension.

This are the differents roles for a shared calendar:

   * **None:** {dav:}no-access
   * **Owner:** {dav:}owner
   * **Read:** {dav:}read
   * **Read-Write:** {dav:}read-write
   * *RSE Extension* **Administration:** {dav:}administration
       * A user with aministration rights can read and write shared users
   * *RSE Extension* **Free/busy:** {dav:}freebusy
       * A user with free/busy can only see that the owner of the events without description, to see if the owner is free or busy.

### Annex A: How we can enhance our permission system in RSE

**How to know how the current user is the owner of the calendar?**

For now, ACL are used to check if user is Admin (ie he/she has every right on this calendar)

We can use `access = SHAREDOWNER`, as every calendar owned by a user as its access flag set to this value.

**CalendarCollectionShell API**

`isPublic`

Is this calendar a public one owned by another user

`isShared`

Is this calendar a shared calendar owned by another user who gave me rights

`isMine`

Am I the owner of the calendar

`canModifyEvents`

Can I create/modify/delete events on this calendar

```
(
    Calendar is mine
    access in SHAREE\_READ\_WRITE, SHAREE\_ADMIN
    Public right in READ\_WRITE
)
```

`canReadEvents`

Can I see events details on this calendar

```
(
    Calendar is mine
    access in SHAREE\_READ, SHAREE\_READ\_WRITE, SHAREE\_ADMIN
    Public right in READ, READ\_WRITE
)
```

`canSeeFreeBusy`

Can I see events details on this calendar

```
(
    Calendar is mine
    access in SHAREE\_FREE\_BUSY, SHAREE\_READ, SHAREE\_READ\_WRITE, SHAREE\_ADMIN
    Public right in READ, READ\_WRITE
)
```

**CalendarRightShell API**

`PublicRightConstant getPublicRight()`

Read or Write
(Used in delegation tab, when reading public right)

`Void updatePublic(newRole)`

Update public role for a calendar.
(Used in delegation tab, when changing public right)

`ShareeRightConstant getUserShareeRight(userId)`

Get ‘access’ value for userId

`[{userId, ShareeRightConstant}] getAllShareeRights(userId)`

Get all sharee rights for a calendar (all the shared rights where `access !== SHAREDOWNER`)

`updateSharee(userId, userEmail, role)`

Update sharee role for a calendar
(Used in delegation tab, when adding/updating sharee)


**Legacy code :**

`clone`

`equals`

`getUserRight(userId)`

ACL Rights management. Used only for user own calendar.
Should be refactored to isMine or isAdmin as ACL won’t be used anymore.

`removeUserRight;`

ACL Rights management. Used only for user own calendar.
Should be refactored to isMine or isAdmin as ACL won’t be used anymore.

`toDAVShareRightsUpdate`

Used to convert the sharees rights in JSON request for Sabre

`toJson`

### Annex B : REST API

#### POST /api/calendars/:calendarId/:calendarUri.json 

**Request Parameters**

- share: an object that describes the new rights for specific users or the rights to remove to a user

**Request URL Parameters:**

- calendarId: the id of the calendar
- calendarUri: the uri of the calendar

**Status Codes:**

- 200 OK
- 400 Bad Request. Invalid request body or parameters.
- 401 Unauthorized. The current request does not contains any valid data to be used for authentication.
- 404 Not Found. The calendar id parameter is not a community id.
- 500 Internal server error.

**Request:**

    POST /api/calendars/:calendarId/:calendarUri.json
    Accept: application/json
    Host: localhost:8080
    {
        "share": {
            "set": [
                {
                    "dav:href":"\url{mailto:user1@open-paas.org}",
                    "dav:read":true
                }
            ],
            "remove": [
                {
                    "dav:href":"\url{mailto:user2@open-paas.org}"
                }
            ]
        }
    }

**Response:**

    HTTP/1.1 200 OK
