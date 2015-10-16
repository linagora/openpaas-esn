'use strict';

/* global chai: false */
var expect = chai.expect;

describe('CalendarShell factory', function() {

  beforeEach(function() {
    this.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };

    this.jstz = {
      determine: function() {
        return {
        name: function() {
          return 'Europe/Paris';
        }};
      }
    };

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('jstz', self.jstz);
      $provide.value('uuid4', self.uuid4);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(CalendarShell, moment) {
      this.CalendarShell = CalendarShell;
      this.moment = moment;
    });
  });

  describe('The toICAL fn', function() {

    it('should correctly create an allday event', function() {
      var shell = {
        start: this.moment(new Date(2014, 11, 29, 18, 0, 0)),
        end: this.moment(new Date(2014, 11, 30, 19, 0, 0)),
        allDay: true,
        title: 'allday event',
        location: 'location',
        description: 'description',
        attendees: [{
          emails: [
            'user1@open-paas.org'
          ],
          displayName: 'User One'
        }, {
          emails: [
            'user2@open-paas.org'
         ],
          displayName: 'user2@open-paas.org'
        }],
        organizer: {
          emails: [
            'organizer@open-paas.org'
          ],
          displayName: 'organizer@open-paas.org'
        }
      };
      var ical = [
        'vcalendar',
        [],
        [
          [
            'vevent',
            [
              [
                'uid',
                {},
                'text',
                '00000000-0000-4000-a000-000000000000'
             ],
              [
                'summary',
                {},
                'text',
                'allday event'
             ],
              [
              'organizer',
              {
                'cn': 'organizer@open-paas.org'
              },
              'cal-address',
              'mailto:organizer@open-paas.org'
             ],
              [
                'dtstart',
                {
                  'tzid': 'Europe\/Paris'
                },
                'date',
                '2014-12-29'
             ],
              [
                'dtend',
                {
                  'tzid': 'Europe\/Paris'
                },
                'date',
                '2014-12-30'
             ],
              [
                'transp',
                {},
                'text',
                'TRANSPARENT'
             ],
              [
                'location',
                {},
                'text',
                'location'
             ],
              [
                'description',
                {},
                'text',
                'description'
             ],
              [
                'attendee',
                {
                  'partstat': 'NEEDS-ACTION',
                  'rsvp': 'TRUE',
                  'role': 'REQ-PARTICIPANT',
                  'cn': 'User One'
                },
                'cal-address',
                'mailto:user1@open-paas.org'
             ],
              [
                'attendee',
                {
                  'partstat': 'NEEDS-ACTION',
                  'rsvp': 'TRUE',
                  'role': 'REQ-PARTICIPANT'
                },
                'cal-address',
                'mailto:user2@open-paas.org'
             ]
           ],
          []
         ]
       ]
     ];
      var vcalendar = this.CalendarShell.toICAL(shell);
      expect(vcalendar.toJSON()).to.deep.equal(ical);
    });

    it('should correctly create a non-allday event', function() {
      var shell = {
        start: this.moment(new Date(2014, 11, 29, 18, 0, 0)),
        end: this.moment(new Date(2014, 11, 29, 19, 0, 0)),
        allDay: false,
        title: 'non-allday event'
      };
      var ical = [
        'vcalendar',
        [],
        [
          [
            'vevent',
            [
              [
                'uid',
                {},
                'text',
                '00000000-0000-4000-a000-000000000000'
             ],
              [
                'summary',
                {},
                'text',
                'non-allday event'
             ],
              [
                'dtstart',
                {
                  'tzid': 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T18:00:00'
             ],
              [
                'dtend',
                {
                  'tzid': 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T19:00:00'
             ],
              [
                'transp',
                {},
                'text',
                'OPAQUE'
             ]
           ],
            []
         ]
       ]
    ];

      var vcalendar = this.CalendarShell.toICAL(shell);
      expect(vcalendar.toJSON()).to.deep.equal(ical);
    });
  });

  describe('for reccurent events', function() {

    function getIcalWithRrule(rrule) {
      return [
        'vcalendar',
        [],
        [
          [
            'vevent',
            [
              [
                'uid',
                {},
                'text',
                '00000000-0000-4000-a000-000000000000'
              ],
              [
                'summary',
                {},
                'text',
                'non-allday event'
              ],
              [
                'dtstart',
                {
                  'tzid': 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T18:00:00'
              ],
              [
                'dtend',
                {
                  'tzid': 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T19:00:00'
              ],
              [
                'transp',
                {},
                'text',
                'OPAQUE'
              ],
              rrule
            ],
            []
          ]
        ]
      ];
    }

    it('should correctly create a recurrent event : daily + interval + count', function() {
      var shell = {
        start: this.moment(new Date(2014, 11, 29, 18, 0, 0)),
        end: this.moment(new Date(2014, 11, 29, 19, 0, 0)),
        allDay: false,
        title: 'non-allday event',
        recur: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };
      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'DAILY',
          count: [3],
          interval: [2]
        }
      ];

      var vcalendar = this.CalendarShell.toICAL(shell);
      expect(vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event : weekly + byday', function() {
      var shell = {
        start: this.moment(new Date(2014, 11, 29, 18, 0, 0)),
        end: this.moment(new Date(2014, 11, 29, 19, 0, 0)),
        allDay: false,
        title: 'non-allday event',
        recur: {
          freq: 'WEEKLY',
          byday: ['MO', 'WE', 'FR']
        }
      };

      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'WEEKLY',
          byday: ['MO', 'WE', 'FR']
        }
      ];

      var vcalendar = this.CalendarShell.toICAL(shell);
      expect(vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event : monthly', function() {
      var shell = {
        start: this.moment(new Date(2014, 11, 29, 18, 0, 0)),
        end: this.moment(new Date(2014, 11, 29, 19, 0, 0)),
        allDay: false,
        title: 'non-allday event',
        recur: {
          freq: 'MONTHLY'
        }
      };

      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'MONTHLY'
        }
      ];

      var vcalendar = this.CalendarShell.toICAL(shell);
      expect(vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event : yearly + until', function() {
      var shell = {
        start: this.moment(new Date(2014, 11, 29, 18, 0, 0)),
        end: this.moment(new Date(2014, 11, 29, 19, 0, 0)),
        allDay: false,
        title: 'non-allday event',
        recur: {
          freq: 'YEARLY',
          until: new Date(2024, 11, 29, 0, 0, 0)
        }
      };

      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'YEARLY',
          until: '2024-12-29T00:00:00'
        }
      ];

      var vcalendar = this.CalendarShell.toICAL(shell);
      expect(vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });
  });

});
