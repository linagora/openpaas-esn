# linagora.esn.calendar overview

The calendar module is built in 3 parts: a frontend, a backend in the ESN and a Sabre server.
It is based on 3 standards: Ical, CalDAV and Jcal:

* ICal is a text representation of events & tasks
* CalDAV is a protocol to store & access ICAL objects in a server based on the WebDAV protocol
* Jcal is a JSON equivalent of Ical (we use http://mozilla-comm.github.io/ical.js/ for parsing/generating ICal & Jcal from/to js objects)

## Backend

### Sabre

[SabreDAV](http://sabre.io) is a Php server implementing the WebDAV, CalDAV & CardDAV standards.
The calendar module is using the CalDAV part of Sabre and adds some custom features thanks to Sabre plugins (https://github.com/linagora/esn-sabre).

#### Sabre data

* Principals: owner of some resources in the DAV server. In Sabre they are stored in `HOST/principals`
* Calendars: Object representing an agenda of a principal. In Sabre they are stored in `HOST/PRINCIPAL_ID/calendars`
* Events: VCALENDAR objects stored within calendars. In Sabre they are stored in `HOST/PRINCIPAL_ID/calendars/CALENDARID/`

#### Sabre MongoDB Backend

All data of Sabre is stored in MongoDB. For that we developed a specific class to handle all necessary operations on calendar objects (cf `lib/CalDAV/Backend/Mongo.php`)

####  Provisioning from the ESN

When Sabre starts, principals are automatically created out of ESN users, communities and projects.

To do this, it queries directly the ESN MongoDB instance and builds the principals out of the objects stored there. (cf `lib/DAVACL/PrincipalBackend/Mongo.php`).

It also creates a default calendar for each of the principals. This calendar is named `events`.

#### Authentication

The requests sent to Sabre are authenticated using the ESN login backend.

The request sent by the client holds authentication info provided by the client (a cookie in the case of the ESN).

Sabre sends a request with this auth info to `ESN/api/login` to verify its authentication in the ESN.

#### JSON Plugin

To allow easier manipulation from our JSON client, we use the ability of Sabre to use JCAL instead of ICAL.

To achieve that, we simply have to set the Header `'Accept:application/json'` in the requests.

Most of the calendar code is handled directly by Sabre: all basic CRUD operations on events.

To handle all custom routes we needed because they were not implemented by default in Sabre, we wrote `lib/JSON/Plugin.php`.

This file is built as a Sabre Plugin (cf http://sabre.io/dav/writing-plugins/) and it defines routes designed for OP needs.

#### Scheduling

Scheduling (https://tools.ietf.org/html/rfc6638) is a feature defined aside CalDAV and implemented by Sabre. It allows to manage the workflow when a user is invited to an event.

The invitations workflow is handled by Sabre and events are generated every time a user needs to be notified due to an invitation.

The file `lib/CalDAV/Schedule/IMipPlugin.php` handles these events and calls a specific OP endpoint (`ESN/api/calendar/calendars/inviteAttendee`) to send emails to right recipients.

### ESN backend

The ESN backend of the calendar module is basically a proxy for Sabre. The requests to Sabre are actually handled by another module (linagora.esn.davproxy).

It also uses the grace period module (linagora.esn.graceperiod) in order to grace the requests before forwarding them. By grace period, it means that when an action is performed, this action is not immediately processed. Indeed, it is queued for a period of time before being processed.

It includes a few http routes to:

* invitation of attendees: sending appropriate emails when called by Sabre Scheduling plugin
* other features described in the Features part of this document

### Realtime

All changes done on calendars objects in Sabre can be done by different clients: the ESN frontend or any CalDAV client.

In order to keep consistent display of events and calendars, changes have to be propagated to the ESN with the actual state of the events in Sabre.

If a user modifies an event from a CalDAV client (like ThunderBird), all its open OP clients to show this modification in realtime.

To achieve that:

* a Sabre plugin pushes a message in RabbitMQ each time something happens which targets a calendar or an event.
* the ESN then listens to RabbitMQ and propagates the action from Sabre to connected OP clients using websockets.

In the ESN: the code listening to RabbitMq and sending events through websockets is in `modules/linagora.esn.calendar/backend/ws/calendar.js`.

## Frontend

### Fullcalendar

The frontend of the calendar module uses Fullcalendar (https://fullcalendar.io/) through its Angular wrapper ui-calendar (http://angular-ui.github.io/ui-calendar/) to display and interact with a calendar view.

The main interactions with ui-calendar are done in `modules/linagora.esn.calendar/frontend/app/calendar/calendar-view/calendar-view.controller.js`

This file defines most of the behavior of interactions between the frontend code and the calendar display.

### FcMoment

Fullcalendar uses a modified version of momentjs (https://momentjs.com) to manage all the time & dates inside the calendar.

But we had to modify it to have it usable with ICAL objects. (cf `modules/linagora.esn.calendar/frontend/app/services/fc-moment.js`)

### Event Sources

Fullcalendar uses "event sources" to fetch events. So we built event sources which fetch events from Sabre. It is worth noting that an event source represents a given calendar.

They can be created using an Angular service in `modules/linagora.esn.calendar/frontend/app/services/calendar-event-source.js`

In order to reduce the number of event requests we built a cache around these event sources : `modules/linagora.esn.calendar/frontend/app/services/cached-event-source.js`

### Shells

Events and Calendars are fetched from Sabre as Jcal objects and then parsed using ical.js into ical.js objects.

However these objects are not as easy to manipulate as we wanted. For example, we wanted to have FcMoments for dates instead of Ical.js datetimes. So we created wrappers around them. They can be found in `modules/linagora.esn.calendar/frontend/app/services/shells`:

* CalendarShell : shell built around a Vcalendar object
* CalendarCollectionShell: object representing a calendar
* RightShell: used for sharing calendar, it can hold the information of the sharings of the calendar : sharees, rights...

### Calls to Sabre

Calls to Sabre are done using the `calendar-service` and `event-service`.

These services are built around `calendar-api` and `event-api` which themselves uses the `request` service:

* `request` does raw http requests to Sabre
* `calendar-api` and `event-api` define all operations needed by clients using the `request` service and uses Jcal objects.
* `calendar-service` and `event-service` calm the \*-apis method and wrap parameters and method returns in shells.

## Features

### Caldav-client

`modules/linagora.esn.calendar/backend/lib/caldav-client/index.js`

This file allows to query Sabre from the backend. It is used by some other features.

### Alarms

The Ical defines that an event might have a reminder named VAlarm.

Our client allows to add a VAlarm to our events using the full form.

For now we only handle the 'EMAIL' type of VAlarm which means that an email is sent to the user when he/she has set the reminder for the event.

Due to our realtime mechanism, when an event is created/modified/deleted in Sabre, the ESN is notified of this through RabbitMq.

And then the ESN calendar backend triggers a special treatment if the event has a VAlarm. (cf `modules/linagora.esn.calendar/backend/lib/alarm/index.js`).

This treatment is to create/modify/delete a future email sending task built using another ESN module (linagora.esn.cron)

### Search

Each module who wants to be searchable has to provide 3 things:

+ in the backend: push its data in ES to have it in an index
+ in the backend: a route which queries ES to retrieve the Data
+ in the frontend:  a provider which queries the backend to get the data from ES and display it in the search main page

The backend part interacting with ES is in `modules/linagora.esn.calendar/backend/lib/search` and the client side (provider) is `modules/linagora.esn.calendar/frontend/app/services/events-provider/events-provider.js`
