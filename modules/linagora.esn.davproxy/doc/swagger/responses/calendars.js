/**
  * @swagger
  * response:
  *   davproxy_calendar_events:
  *     description: |
  *       OK. With content of file events.json.
  *     examples:
  *       application/json:
  *         {
  *           "_links": {
  *             "self": {
  *               "href": "/sdav/calendars/594780e435f57007b66c076c/events.json"
  *             }
  *           },
  *           "_embedded": {
  *             "dav:item": [
  *               {
  *                 "_links": {
  *                    "self": {
  *                       "href": "/sdav/calendars/594780e435f57007b66c076c/events/sabredav-7d4f7664-980b-466e-903c-6b78a3378907.ics"
  *                     }
  *                  },
  *                  "etag": "\"28a3bb4dd5206d8b2a1ff966240caba8\"",
  *                  "data": [
  *                     "vcalendar",
  *                     [
  *                       [
  *                         "prodid",
  *                         {},
  *                         "text",
  *                         "-//Sabre//Sabre VObject 4.1.2//EN"
  *                       ]
  *                     ],
  *                     [
  *                       [
  *                         "vevent",
  *                         [
  *                           [
  *                             "created",
  *                             {},
  *                             "date-time",
  *                             "2017-07-27T08:08:44Z"
  *                           ],
  *                           [
  *                             "attendee",
  *                             {
  *                               "cutype": "INDIVIDUAL",
  *                               "rsvp": "TRUE",
  *                               "cn": "Patrick PAYSANT",
  *                               "partstat": "NEEDS-ACTION",
  *                               "x-obm-id": "62"
  *                             },
  *                             "cal-address",
  *                             "MAILTO:ppaysant@linagora.com"
  *                           ],
  *                           [
  *                             "recurrence-id",
  *                             {},
  *                             "date-time",
  *                             "2017-08-29T16:00:00Z"
  *                           ]
  *                         ],
  *                         []
  *                       ]
  *                     ]
  *                  ]
  *               }
  *             ]
  *           }
  *         }
  */
