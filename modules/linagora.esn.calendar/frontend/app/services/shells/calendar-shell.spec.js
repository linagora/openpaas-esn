'use strict';

/* global chai, sinon, _, __FIXTURES__: false */

var expect = chai.expect;

describe('CalendarShell factory', function() {
  var CalendarShell, calMoment, calPathBuilder, ICAL, $rootScope, calEventService;

  function loadICSFixtureAsCalendarShell(file, folder) {
    var path = 'modules/linagora.esn.calendar/frontend/app/fixtures/calendar/' + (folder ? folder + '/' : '') + file;

    return new CalendarShell(ICAL.Component.fromString(__FIXTURES__[path]));
  }

  beforeEach(function() {
    this.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };

    this.calEventAPIMock = {};

    this.calMasterEventCache = {
      save: angular.noop
    };

    this.localTimezone = 'Asia/Ho_Chi_Minh';

    this.jstzMock = {
      determine: _.constant({
        name: _.constant(this.localTimezone)
      })
    };

    var self = this;

    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('uuid4', self.uuid4);
      $provide.value('calEventAPI', self.calEventAPIMock);
      $provide.value('calMasterEventCache', self.calMasterEventCache);
      $provide.value('jstz', self.jstzMock);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_CalendarShell_, _calMoment_, _calPathBuilder_, _ICAL_, _$rootScope_, _calEventService_) {
      CalendarShell = _CalendarShell_;
      calMoment = _calMoment_;
      calPathBuilder = _calPathBuilder_;
      ICAL = _ICAL_;
      $rootScope = _$rootScope_;
      calEventService = _calEventService_;
    });
  });

  describe('applyReply', function() {
    function getShellFromFixture(string) {
      var path = 'modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reply_test/' + string;

      return new CalendarShell(new ICAL.Component(JSON.parse(__FIXTURES__[path])));
    }

    it('should correctly update PARTSTAT without erasing other partstat neither RRULE', function() {

      var ical = getShellFromFixture('before.json');
      var reply = getShellFromFixture('reply.json');

      ical.applyReply(reply);
      var expectedResult = getShellFromFixture('result.json');

      expect(ical.equals(expectedResult)).to.be.true;
    });

    it('should correctly update PARTSTAT on instance', function() {

      var ical = getShellFromFixture('before_instance.json');
      var reply = getShellFromFixture('reply_instance.json');

      ical.applyReply(reply);
      var expectedResult = getShellFromFixture('result_instance.json');

      expect(ical.equals(expectedResult)).to.be.true;
      expect(ical.expand()[2].equals(expectedResult.expand()[2])).to.be.true; //because for the moment ical.equals does not check instance
    });

    it('should correctly update PARTSTAT on instance and not erase previous property if exception was already here', function() {

      var ical = getShellFromFixture('before_exception.json');
      var reply = getShellFromFixture('reply_exception.json');

      ical.applyReply(reply);
      var expectedResult = getShellFromFixture('result_exception.json');

      expect(ical.equals(expectedResult)).to.be.true;
      expect(ical.expand()[2].equals(expectedResult.expand()[2])).to.be.true; //because for the moment ical.equals does not check instance
    });
  });

  describe('set date', function() {
    it('should convert date to localTimezone', function() {
      var shell = CalendarShell.fromIncompleteShell({});

      shell.start = calMoment.tz([2015, 11, 11, 19, 0, 0], 'Europe/Paris');
      expect(shell.vevent.getFirstProperty('dtstart').getParameter('tzid')).to.equal(this.localTimezone);
      expect(shell.vevent.getFirstPropertyValue('dtstart').toString()).to.equal('2015-12-12T01:00:00');

      shell.end = calMoment.utc([2015, 11, 11, 19, 0, 0]);
      expect(shell.vevent.getFirstProperty('dtend').getParameter('tzid')).to.equal(this.localTimezone);
      expect(shell.vevent.getFirstPropertyValue('dtend').toString()).to.equal('2015-12-12T02:00:00');
    });

    it('should not lose allday', function() {
      var shell, start = calMoment(new Date(2014, 11, 29));
      var end = calMoment(new Date(2014, 11, 29));

      start.stripTime();
      end.stripTime();
      shell = CalendarShell.fromIncompleteShell({
        start: start,
        end: end
      });

      expect(shell.start.hasTime()).to.be.false;
      expect(shell.end.hasTime()).to.be.false;
    });

    it('if recurrent it should remove exception if start or end date change', function() {
      ['end', 'start'].forEach(function(date) {
        var vcalendar = new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']));
        var shell = new CalendarShell(vcalendar);

        shell[date] = calMoment([2015, 1, 6, 10, 40]);
        expect(shell.vcalendar.getAllSubcomponents('vevent').length).to.equal(1);
      });
    });

    it('if recurrent it should not remove exception if start or end date change to the same value', function() {
      var vcalendar = new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']));
      var shell = new CalendarShell(vcalendar);

      shell.start = calMoment.utc([2016, 2, 7, 15, 0]);
      shell.end = calMoment.utc([2016, 2, 7, 16, 0]);
      expect(shell.vcalendar.getAllSubcomponents('vevent').length).to.equal(2);
    });

    it('if recurrent it should remove exception if start pass to allDay', function() {
      var midnight = calMoment.utc([2016, 2, 7, 17, 0]);
      var vcalendar = new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']));

      vcalendar.getFirstSubcomponent('vevent').updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(midnight.toDate(), true).convertToZone(ICAL.TimezoneService.get(this.localTimezone)));

      midnight.hasTime = function() {
        return false;
      };

      var shell = new CalendarShell(vcalendar);

      shell.start = midnight;
      expect(shell.vcalendar.getAllSubcomponents('vevent').length).to.equal(1);
    });
  });

  describe('vtimezone', function() {
    it('should only have one vtimezone for each tzid used in the event', function() {
      var vevent = new ICAL.Component('vevent');
      var newShell = new CalendarShell(vevent);

      expect(newShell.vcalendar.getAllSubcomponents('vtimezone').length).to.equal(1);
    });

    it('it should not add redundant vtimezone when updating vevent', function() {
      var event = CalendarShell.fromIncompleteShell({
        title: 'title',
        path: '/path/to/event',
        location: 'aLocation',
        etag: 'etag'
      });
      var editEvent = event.clone();

      editEvent.location = 'bLocation';

      this.calEventAPIMock.modify = function() {
        return $q.when({});
      };

      calEventService.modifyEvent('/path/to/event', editEvent, event, 'etag', angular.noop);
      expect(event.vcalendar.getAllSubcomponents('vtimezone').length).to.equal(1);
    });
  });

  describe('Attendees', function() {
    it('should allow several attendee properties', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0)),
        title: 'non-allday event'
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      shell.attendees = [{
        displayName: 'Leigh Rafe',
        email: 'leigh.rafe@demo.open-paas.org',
        fullmail: 'Leigh Rafe <leigh.rafe@demo.open-paas.org>',
        name: 'Leigh Rafe',
        partstat: 'NEEDS-ACTION'
      }, {
        displayName: 'Leigh Rafe',
        email: 'leigh.rafe@demo.open-paas.org',
        fullmail: 'Leigh Rafe <leigh.rafe@demo.open-paas.org>',
        name: 'Leigh Rafe',
        partstat: 'NEEDS-ACTION'
      }];

      expect(shell.attendees.length).to.equal(2);
    });

    it('should work with recurring event with exception', function() {
      var shell = new CalendarShell(new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics'])), {path: '/path/to/uid.ics'});

      shell.attendees = [{
          displayName: 'Leigh Rafe',
          email: 'leigh.rafe@demo.open-paas.org',
          fullmail: 'Leigh Rafe <leigh.rafe@demo.open-paas.org>',
          name: 'Leigh Rafe',
          partstat: 'NEEDS-ACTION'
        }];

      expect(shell.expand()[0].attendees.length).to.equal(1);
    });

    it('should not break vcomponents.toString()', function() {
      var shell = new CalendarShell(new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics'])), {path: '/path/to/uid.ics'});

      shell.attendees = [{
        email: 'leigh.rafe@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }];

      shell.vcalendar.toString();
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
                'transp',
                {},
                'text',
                'OPAQUE'
              ],
              [
                'dtstart',
                {
                  tzid: 'Asia/Ho_Chi_Minh'
                },
                'date-time',
                '2014-12-30T01:00:00'
              ],
              [
                'dtend',
                {
                  tzid: 'Asia/Ho_Chi_Minh'
                },
                'date-time',
                '2014-12-30T02:00:00'
              ],
              [
                'summary',
                {},
                'text',
                'non-allday event'
              ],
              rrule
            ],
            []
          ],
          [
            'vtimezone',
            [
              [
                'tzid',
                {},
                'text',
                'Asia/Ho_Chi_Minh'
              ]
            ],
            [
              [
                'standard',
                [
                  [
                    'tzoffsetfrom',
                    {},
                    'utc-offset',
                    '+07:00'
                  ],
                  [
                    'tzoffsetto',
                    {},
                    'utc-offset',
                    '+07:00'
                  ],
                  [
                    'tzname',
                    {},
                    'text',
                    'ICT'
                  ],
                  [
                    'dtstart',
                    {},
                    'date-time',
                    '1970-01-01T00:00:00'
                  ]
                ],
                []
              ]
            ]
          ]
        ]
      ];
    }

    it('should correctly create a recurrent event : daily + interval + count', function() {
      var shell = {
        start: calMoment.utc([2014, 11, 29, 18, 0, 0]),
        end: calMoment.utc([2014, 11, 29, 19, 0, 0]),
        title: 'non-allday event',
        rrule: {
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
          count: 3,
          interval: 2
        }
      ];

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event: weekly + byday', function() {
      var shell = {
        start: calMoment.utc([2014, 11, 29, 18, 0, 0]),
        end: calMoment.utc([2014, 11, 29, 19, 0, 0]),
        title: 'non-allday event',
        rrule: {
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

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event: monthly', function() {
      var shell = {
        start: calMoment.utc([2014, 11, 29, 18, 0, 0]),
        end: calMoment.utc([2014, 11, 29, 19, 0, 0]),
        title: 'non-allday event',
        rrule: {
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

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event: yearly + until', function() {
      var shell = {
        start: calMoment.utc([2014, 11, 29, 18, 0, 0]),
        end: calMoment.utc([2014, 11, 29, 19, 0, 0]),
        title: 'non-allday event',
        rrule: {
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

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should create a recurrent event with a method isRecurring returning true', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0)),
        title: 'non-allday event',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.isRecurring()).to.be.true;
    });

  });

  describe('isPublic method', function() {
    it('should return true for event having no class', function() {
      var shell = CalendarShell.fromIncompleteShell({});

      expect(shell.isPublic()).to.be.true;
    });

    it('should return true for the public event', function() {
      var shell = {
        class: 'PUBLIC'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.isPublic()).to.be.true;
    });

    it('should return false for the private event', function() {
      var shell = {
        class: 'PRIVATE'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.isPublic()).to.be.false;
    });

    it('should return false for an event having an unknown class', function() {
      var shell = {
        class: 'UNKNOWN'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.isPublic()).to.be.false;
    });
  });

  describe('isPrivate method', function() {
    it('should return false for event having no class', function() {
      var shell = CalendarShell.fromIncompleteShell({});

      expect(shell.isPrivate()).to.be.false;
    });

    it('should return false for a public event', function() {
      var shell = {
        class: 'PUBLIC'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.isPrivate()).to.be.false;
    });

    it('should return true for the private event', function() {
      var shell = {
        class: 'PRIVATE'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.isPrivate()).to.be.true;
    });

    it('should return false for an event having an unknown class', function() {
      var shell = {
        class: 'UNKNOWN'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.isPrivate()).to.be.false;
    });
  });

  describe('isRecurring method', function() {
    it('should return true for reccuring event', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0)),
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.isRecurring()).to.be.true;
    });

    it('should return false for non reccuring event', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.isRecurring()).to.be.false;
    });
  });

  describe('The reccurenceIdAsString getter', function() {
    it('should return empty string when event does not have reccurence', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'not reccurent'
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.recurrenceIdAsString).to.be.empty;
    });

    it('should return the reccurence id as string', function() {
      var start = calMoment.utc('2015-01-01 18:01');
      var shell = {
        start: start,
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand()[0].recurrenceIdAsString).to.equal('20150101T180100Z');
    });
  });

  describe('expand method', function() {

    function formatDates(event) {
      event.formattedStart = event.vevent.getFirstPropertyValue('dtstart').convertToZone(ICAL.Timezone.utcTimezone).toString();
      event.formattedEnd = event.vevent.getFirstPropertyValue('dtend').convertToZone(ICAL.Timezone.utcTimezone).toString();
      event.formattedRecurrenceId = event.vevent.getFirstPropertyValue('recurrence-id').convertToZone(ICAL.Timezone.utcTimezone).toString();

      return event;
    }

    it('should return an empty array for non recurring event', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.expand()).to.deep.equal([]);
    });

    it('should fail if called without end date and max element if the event have a infinity of sub event', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0)),
        rrule: {
          freq: 'DAILY',
          interval: 2
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.expand).to.throw(Error);
    });

    it('should not fail if called with end date and max element if the event has count', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0)),
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 2
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.expand.bind(shell)).to.not.throw(Error);
    });

    it('should not fail if called with end date and max element if the event has until', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0)),
        rrule: {
          freq: 'DAILY',
          interval: 2,
          until: new Date()
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.expand.bind(shell)).to.not.throw(Error);
    });

    it('should compute correctly recurrenceId in UTC Timezone', function() {
      var shell = {
        start: calMoment.tz('2015-01-01 18:01', 'America/Toronto'),
        end: calMoment.tz('2015-01-01 19:01', 'America/Toronto'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 1
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.expand()[0].vevent.getFirstProperty('recurrence-id').getParameter('tzid')).to.be.undefined;
      expect(shell.expand()[0].vevent.getFirstPropertyValue('recurrence-id').toString()).to.equals('2015-01-01T23:01:00Z');
    });

    it('should not mute master event', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));
      var masterIcsAfterExpand, masterIcsBeforeExpand;

      masterIcsBeforeExpand = shell.vcalendar.toString();
      shell.expand();
      shell.vcalendar.addSubcomponent(ICAL.TimezoneService.get(this.localTimezone).component);
      masterIcsAfterExpand = shell.vcalendar.toString();
      expect(masterIcsAfterExpand).to.equal(masterIcsBeforeExpand);
    });

    it('should compute start date and end date of instance in same start date of master', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));
      var event = shell.expand()[0];

      expect(event.vevent.getFirstProperty('dtstart').getParameter('tzid')).to.equal('America/Chicago');
      expect(event.vevent.getFirstProperty('dtend').getParameter('tzid')).to.equal('America/Chicago');

      expect(event.vevent.getFirstPropertyValue('dtstart').toString()).to.equal('2016-03-07T10:00:00');
      expect(event.vevent.getFirstPropertyValue('dtend').toString()).to.equal('2016-03-07T11:00:00');
    });

    it('should expand correctly all subevent if no start and end date specified', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand().map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-01T18:01:00Z',
          formattedEnd: '2015-01-01T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        1: {
          title: 'reccurent',
          formattedStart: '2015-01-03T18:01:00Z',
          formattedEnd: '2015-01-03T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        2: {
          title: 'reccurent',
          formattedStart: '2015-01-05T18:01:00Z',
          formattedEnd: '2015-01-05T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 3
      });
    });

    it('should expand in element that has no trace of others exceptions', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));

      shell.expand().forEach(function(shell) {
        expect(shell.vcalendar.getAllSubcomponents('vevent').length).to.equal(1);
      });
    });

    it('should take mutation of subevent into consideration', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      var subevents = shell.expand();

      subevents[0].start = calMoment.utc('2015-01-01T18:30:00');
      subevents[0].title = 'benjen stark is alive';
      shell.modifyOccurrence(subevents[0]);

      expect(shell.expand().map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'benjen stark is alive',
          formattedStart: '2015-01-01T18:30:00Z',
          formattedEnd: '2015-01-01T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        1: {
          title: 'reccurent',
          formattedStart: '2015-01-03T18:01:00Z',
          formattedEnd: '2015-01-03T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        2: {
          title: 'reccurent',
          formattedStart: '2015-01-05T18:01:00Z',
          formattedEnd: '2015-01-05T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 3
      });
    });

    it('should expand correctly recurrent event with timezone', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));

      expect(shell.expand().map(formatDates)).to.shallowDeepEqual({
        0: {
          formattedRecurrenceId: '2016-03-07T15:00:00Z',
          formattedStart: '2016-03-07T16:00:00Z',
          formattedEnd: '2016-03-07T17:00:00Z'
        },
        1: {
          formattedRecurrenceId: '2016-03-08T15:00:00Z',
          formattedStart: '2016-03-08T15:00:00Z',
          formattedEnd: '2016-03-08T16:00:00Z'
        },
        length: 2
      });
    });

    it('should expand correctly recurrent event with exdate', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithExdate.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));

      expect(shell.expand().length).to.equal(2);
    });

    it('should expand correctly all subevent before enddate if no startDate given', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(null, calMoment.utc('2015-01-02 00:00')).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-01T18:01:00Z',
          formattedEnd: '2015-01-01T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand correctly all subevent after start if no end date given', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(calMoment.utc('2015-01-04 00:00')).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-05T18:01:00Z',
          formattedEnd: '2015-01-05T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand correctly all subevent between start date and end date', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(calMoment.utc('2015-01-02 00:00'), calMoment.utc('2015-01-04 00:00')).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-03T18:01:00Z',
          formattedEnd: '2015-01-03T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand correctly all subevent between start time stripTime date and end stripTime date', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(calMoment.utc('2015-01-02').stripTime(), calMoment.utc('2015-01-04').stripTime()).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-03T18:01:00Z',
          formattedEnd: '2015-01-03T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand no more event than given maxElement', function() {
      var shell = {
        start: calMoment.utc('2015-01-01 18:01'),
        end: calMoment.utc('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(null, null, 2).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-01T18:01:00Z',
          formattedEnd: '2015-01-01T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        1: {
          title: 'reccurent',
          formattedStart: '2015-01-03T18:01:00Z',
          formattedEnd: '2015-01-03T19:01:00Z',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 2
      });
    });
  });

  describe('deleteInstance', function() {
    it('should correctly delete non exceptional instance', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));
      var instances = shell.expand();
      var instanceToDelete = instances.pop();

      shell.deleteInstance(instanceToDelete);
      var expandResult = shell.expand();

      expect(expandResult.length).to.equal(1);
      expect(expandResult[0].equals(instances[0]));
      expect(shell.vevent.getFirstPropertyValue('exdate')).to.equal(instanceToDelete.vevent.getFirstPropertyValue('recurrence-id'));
    });

    it('should correctly delete exceptional instance', function() {
      var vcalendar = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics']);
      var shell = new CalendarShell(new ICAL.Component(vcalendar));
      var instances = shell.expand();
      var instanceToDelete = instances.shift();

      shell.deleteInstance(instanceToDelete);
      var expandResult = shell.expand();

      expect(expandResult.length).to.equal(1);
      expect(expandResult[0].equals(instances[0]));
      expect(shell.vevent.getFirstPropertyValue('exdate')).to.equal(instanceToDelete.vevent.getFirstPropertyValue('recurrence-id'));
      expect(shell.vcalendar.getAllSubcomponents('vevent').filter(function(vevent) {
        return vevent.getFirstPropertyValue('recurrence-id');
      }).length).to.equal(0);
    });

  });

  describe('getModifiedMaster method', function() {

    it('should return itself if the shell is a master', function(done) {
      var shell = CalendarShell.fromIncompleteShell({});

      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell).to.equal(shell);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should return the cached master if it exists', function(done) {
      var date = calMoment('1999-05-19 01:01');
      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: date
      });

      var masterFromCache = CalendarShell.fromIncompleteShell({start: date});

      this.calMasterEventCache.get = sinon.stub().returns(masterFromCache);
      this.calMasterEventCache.save = sinon.spy();

      var self = this;

      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell).to.equal(masterFromCache);
        expect(self.calMasterEventCache.get).to.have.been.calledWith(shell.path);
        expect(self.calMasterEventCache.save).to.have.been.calledWith(masterFromCache);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should fetch the master on the server if not already cached', function(done) {
      var path = 'this is a path';
      var date = calMoment('2005-05-19 01:01');
      var vcalendar = CalendarShell.fromIncompleteShell({start: date}).vcalendar;
      var gracePeriodTaskId = 'gracePeriodID';
      var etag = 'eta';

      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: calMoment(),
        path: path,
        etag: etag,
        gracePeriodTaskId: gracePeriodTaskId
      });

      this.calMasterEventCache.get = sinon.stub().returns(null);
      this.calMasterEventCache.save = sinon.spy();

      this.calEventAPIMock.get = function(_path) {
        expect(_path).to.equal(path);

        return $q.when({data: vcalendar.toJSON()});
      };

      var self = this;

      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell.vcalendar.toJSON()).to.deep.equal(vcalendar.toJSON());
        expect(masterShell.etag).to.equal(etag);
        expect(masterShell.gracePeriodTaskId).to.equal(gracePeriodTaskId);
        expect(self.calMasterEventCache.get).to.have.been.calledWith(shell.path);
        expect(self.calMasterEventCache.save).to.have.been.calledWith(masterShell);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should fail if fetching the master on the server has failed', function(done) {

      var error = {};

      this.calEventAPIMock.get = function() {
        return $q.reject(error);
      };

      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: calMoment()
      });

      this.calMasterEventCache.get = function(path) {
        expect(path).to.equal(shell.path);
      };

      shell.getModifiedMaster().then(
        done.bind(this, 'this promise should have failed'),
      function(_error) {
        expect(_error).to.equal(error);
        done();
      });

      $rootScope.$apply();
    });

  });

  describe('calendarId property', function() {
    it('should compute the id from the path', function() {
      var event = CalendarShell.fromIncompleteShell({path: '/calendarHomeId/calendarId/events'});

      expect(event.calendarId).to.equal('calendarId');
    });
  });

  describe('calendarUniqueId property', function() {
    it('should be computed with calPathBuilder.forCalendarId function from calendar Home Id and Id', function() {
      var event = CalendarShell.fromIncompleteShell({path: 'xxxxxxxxxxxx/calendarHomeId/calendarId/eventUid.ics'});

      expect(event.calendarUniqueId).to.equal(calPathBuilder.forCalendarId('calendarHomeId', 'calendarId'));
    });
  });

  describe('modifyOccurence method', function() {

    it('should failed if called on a non master event', function(done) {
      var nonMasterEvent = CalendarShell.fromIncompleteShell({
        recurrenceId: calMoment()
      });

      try {
        nonMasterEvent.modifyOccurrence();
        done('should have thrown an error');
      } catch (e) {
        done();
      }
    });

    it('should add the modified occurence in the vcalendar of the master shell if not already there', function() {
      var nonMasterEvent = CalendarShell.fromIncompleteShell({
        recurrenceId: calMoment('1983-05-25 01:01')
      });

      this.calMasterEventCache.save = sinon.spy();

      var masterEvent = CalendarShell.fromIncompleteShell({start: calMoment('2015-08-21 01:01')});

      masterEvent.modifyOccurrence(nonMasterEvent);

      var vevents = masterEvent.vcalendar.getAllSubcomponents('vevent');

      expect(vevents.length).to.equal(2);

      var numSame = 0;

      vevents.forEach(function(vevent) {
        numSame += angular.equals(vevent.toJSON(), nonMasterEvent.vevent.toJSON()) ? 1 : 0;
      });
      expect(numSame).to.equal(1);
      expect(this.calMasterEventCache.save).to.have.been.calledWith(masterEvent);
    });

    it('should replace the modified occurence in the vcalendar of the master shell if already there', function() {
      var recurrenceId = calMoment('1999-05-19 01:01');
      this.calMasterEventCache.save = sinon.spy();

      var nonMasterEvent = CalendarShell.fromIncompleteShell({
        recurrenceId: recurrenceId
      });

      var nonMasterEventModified = CalendarShell.fromIncompleteShell({
        recurrenceId: recurrenceId,
        start: calMoment('1983-05-25 01:01')
      });

      var masterEvent = CalendarShell.fromIncompleteShell({start: calMoment('1983-05-25 01:01')});
      masterEvent.modifyOccurrence(nonMasterEvent);

      masterEvent.modifyOccurrence(nonMasterEventModified);

      var vevents = masterEvent.vcalendar.getAllSubcomponents('vevent');

      expect(vevents.length).to.equal(2);
      var numSame = 0;

      vevents.forEach(function(vevent) {
        numSame += angular.equals(vevent.toJSON(), nonMasterEventModified.vevent.toJSON()) ? 1 : 0;
      });

      expect(numSame).to.equal(1);
      expect(this.calMasterEventCache.save).to.have.been.calledWith(masterEvent);
    });

    it('should not register the masterShell in the calMasterEventCache if notRefreshCache is true', function() {
      var recurrenceId = calMoment('1977-05-27 01:01');
      var nonMasterEvent = CalendarShell.fromIncompleteShell({
        recurrenceId: recurrenceId
      });

      this.calMasterEventCache.save = sinon.spy();

      var masterEvent = CalendarShell.fromIncompleteShell({start: calMoment('1983-05-25 01:01')});
      masterEvent.modifyOccurrence(nonMasterEvent, true);
      expect(this.calMasterEventCache.save).to.not.have.been.called;
    });
  });

  describe('isRealException function', function() {

    it('should return true if the instance is an exception', function() {
      var recurrenceId = calMoment('1977-05-27 01:01');
      var start = calMoment('1980-05-17 01:01');
      var nonMasterEventModified = CalendarShell.fromIncompleteShell({
        recurrenceId: recurrenceId,
        start: start
      });

      var masterEvent = CalendarShell.fromIncompleteShell({start: recurrenceId});

      expect(masterEvent.isRealException(nonMasterEventModified)).to.be.true;
    });

    it('should return false if the instance is not an exception', function() {
      var start = calMoment('2002-05-16 01:01');
      var nonMasterEventNonModified = CalendarShell.fromIncompleteShell({
        recurrenceId: start,
        start: start
      });

      var masterEvent = CalendarShell.fromIncompleteShell({start: start});

      expect(masterEvent.isRealException(nonMasterEventNonModified)).to.be.false;
    });

    it('should return false if the event is not an exception and has a recurrent id with another timezone', function() {
      var vcalendar = new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/test/unit-frontend/fixtures/calendar/reventWithDiffTz.ics']));
      var shell = new CalendarShell(vcalendar);
      var instance = shell.vcalendar.getAllSubcomponents('vevent');

      var event = new CalendarShell(instance[1]);

      expect(shell.isRealException(event)).to.be.false;
    });
  });

  describe('equals method', function() {
    it('should return call isSame for start, end and recurrenceId properties', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });
      var eventB = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });

      eventA.start.foo = 'bar';
      eventA.end.foo = 'bar';
      eventA.recurrendId.foo = 'bar';
      expect(eventA.equals(eventB)).to.be.true;
    });

    it('should not fail if that.rrule is undefined', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00'),
        rrule: 'isdefined'
      });
      var eventB = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });

      expect(eventA.equals(eventB)).to.be.false;
    });

    it('should return true if alarm are equals', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        alarm: {
          action: 'EMAIL',
          summary: 'summary',
          description: 'description',
          trigger: '-PT15M',
          attendee: 'attendee'
        }
      });
      var eventB = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        alarm: {
          action: 'EMAIL',
          summary: 'summary',
          description: 'description',
          trigger: '-PT15M',
          attendee: 'attendee'
        }
      });

      expect(eventA.equals(eventB)).to.be.true;
    });

    it('should return false if alarm are not equals', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        alarm: {
          action: 'EMAIL',
          summary: 'summary',
          description: 'description',
          trigger: '-PT15M',
          attendee: 'attendee'
        }
      });
      var eventB = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        alarm: {
          action: 'EMAIL',
          summary: 'summary',
          description: 'description',
          trigger: '-PT30M',
          attendee: 'attendee'
        }
      });

      expect(eventA.equals(eventB)).to.be.false;
    });

    it('should return true if both of eventA.alarm and eventB.alarm is undefined', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00')
      });
      var eventB = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00')
      });

      expect(eventA.equals(eventB)).to.be.true;
    });

    it('should return false if one of alarms is undefined', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00')
      });

      var eventB = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        alarm: {
          action: 'EMAIL',
          summary: 'summary',
          description: 'description',
          trigger: '-PT30M',
          attendee: 'attendee'
        }
      });

      expect(eventA.equals(eventB)).to.be.false;
    });

    it('should return false if change from recurrent event to non-recurrent', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00'),
        rrule: {
          freq: 'DAILY',
          interval: 2
        }
      });

      var eventB = eventA.clone();

      eventB.rrule = undefined;
      expect(eventA.equals(eventB)).to.be.false;
    });
  });

  describe('Alarm', function() {
    it('should create a valarm component with trigger, action, summary, description and attendee', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });

      eventA.alarm = {
        trigger: '-PT30M',
        attendee: 'test@open-paas.org'
      };
      expect(eventA.alarm.trigger.toICALString()).to.equal('-PT30M');
      expect(eventA.alarm.attendee).to.equal('mailto:test@open-paas.org');
      expect(eventA.alarm.action).to.equal('EMAIL');
      expect(eventA.alarm.summary).to.exist;
      expect(eventA.alarm.description).to.exist;
    });

    it('should not create 2 alarms but delete/create again', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });

      eventA.alarm = {
        trigger: '-PT30M',
        attendee: 'test@open-paas.org'
      };
      eventA.alarm = {
        trigger: '-PT30M',
        attendee: 'test2@open-paas.org'
      };
      expect(eventA.alarm.trigger.toICALString()).to.equal('-PT30M');
      expect(eventA.alarm.attendee).to.equal('mailto:test2@open-paas.org');
      expect(eventA.alarm.action).to.equal('EMAIL');
      expect(eventA.alarm.summary).to.exist;
      expect(eventA.alarm.description).to.exist;
      expect(eventA.vevent.getAllSubcomponents('valarm').length).to.equal(1);
    });

    it('should fail if trigger is undefined', function(done) {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });

      try {
        eventA.alarm = {attendeeEmail: 'test'};
      } catch (e) {
        done();
      }
    });

    it('should fail if attendeeEmail is undefined', function(done) {
      var eventA = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-01 18:00'),
        recurrendId: calMoment('2015-01-01 18:00')
      });

      try {
        eventA.alarm = {trigger: 'test'};
      } catch (e) {
        done();
      }
    });

    function expectAlarm(event, expectedSummary, expectedLocation, expectedStart, expectedEnd, expectedClass) {
      expect(event.alarm.summary).to.equal('Pending event! ' + expectedSummary);
      expect(event.alarm.description)
        .to.contain('The event ' + expectedSummary + ' will start')
        .and.to.contain('start: ' + expectedStart)
        .and.to.contain('end: ' + expectedEnd)
        .and.to.contain('location: ' + expectedLocation + ' \\n')
        .and.to.contain('class: ' + expectedClass + ' \\n')
        .and.to.contain(
        'More details:\\n' +
        'https://localhost:8080/#/calendar//event/00000000-0000-4000-a000-000000000000/consult'
      );
    }

    it('should not escape value of some valarm properties', function() {
      var summary = 'My <&> "event"';
      var location = 'My <&> "location"';
      var classProperty = 'MY <&> "class"';
      var event = CalendarShell.fromIncompleteShell({
        start: calMoment('2015-01-01 18:00'),
        end: calMoment('2015-01-02 18:00'),
        location: location,
        class: classProperty,
        summary: summary
      });

      event.alarm = {
        trigger: '-PT30M',
        attendee: 'test@open-paas.org'
      };

      expectAlarm(event, summary, location, 'Thu Jan 01 2015 18:00:00', 'Fri Jan 02 2015 18:00:00', classProperty);
    });

    it('should update the alarm when any related information is updated', function() {
      var summary = 'Initial summary',
          updatedSummary = 'Updated summary',
          location = 'Initial location',
          classProperty = 'Initial class',
          updatedClass = 'Updated class',
          updatedLocation = 'Updated location',
          start = calMoment('2015-01-01 12:00'),
          updatedStart = calMoment('2015-01-01 13:00'),
          end = calMoment('2015-01-02 12:00'),
          updatedEnd = calMoment('2015-01-02 13:00'),
          event = CalendarShell.fromIncompleteShell({
            start: start,
            end: end,
            location: location,
            summary: summary,
            class: classProperty
          });

      event.alarm = { trigger: '-PT30M', attendee: 'test@open-paas.org' };
      expectAlarm(event, summary, location, 'Thu Jan 01 2015 12:00:00', 'Fri Jan 02 2015 12:00:00', classProperty);

      event.summary = updatedSummary;
      expectAlarm(event, updatedSummary, location, 'Thu Jan 01 2015 12:00:00', 'Fri Jan 02 2015 12:00:00', classProperty);

      event.location = updatedLocation;
      expectAlarm(event, updatedSummary, updatedLocation, 'Thu Jan 01 2015 12:00:00', 'Fri Jan 02 2015 12:00:00', classProperty);

      event.start = updatedStart;
      expectAlarm(event, updatedSummary, updatedLocation, 'Thu Jan 01 2015 13:00:00', 'Fri Jan 02 2015 12:00:00', classProperty);

      event.end = updatedEnd;
      expectAlarm(event, updatedSummary, updatedLocation, 'Thu Jan 01 2015 13:00:00', 'Fri Jan 02 2015 13:00:00', classProperty);

      event.location = updatedLocation;
      expectAlarm(event, updatedSummary, updatedLocation, 'Thu Jan 01 2015 13:00:00', 'Fri Jan 02 2015 13:00:00', classProperty);

      event.class = updatedClass;
      expectAlarm(event, updatedSummary, updatedLocation, 'Thu Jan 01 2015 13:00:00', 'Fri Jan 02 2015 13:00:00', updatedClass);
    });
  });

  describe('getOrganizerPartStat', function() {
    it('should return null if shell has no organizer', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.getOrganizerPartStat()).to.not.exist;
    });

    it('should return the organizer partstat if it exists', function() {
      var data = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };
      var shell = CalendarShell.fromIncompleteShell(data);

      shell.organizer = {
        email: 'user1@demo.open-paas.org',
        displayName: 'user1'
      };
      shell.attendees = [{
        displayName: 'user1',
        email: 'user1@demo.open-paas.org',
        fullmail: 'user1 <user1@demo.open-paas.org>',
        name: 'user1',
        partstat: 'ACCEPTED'
      }, {
        displayName: 'user2',
        email: 'user2@demo.open-paas.org',
        fullmail: 'user2 <user2@demo.open-paas.org>',
        name: 'user2',
        partstat: 'DECLINED'
      }];
      expect(shell.getOrganizerPartStat()).to.equal('ACCEPTED');
    });
  });

  describe('setOrganizerPartStat', function() {
    it('should do nothing if the shell has no organizer', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      shell.setOrganizerPartStat('ACCEPTED');
      expect(shell.attendees).to.deep.equal([]);
    });

    it('should add an attendee with specified partstat for organizer if there was none', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      shell.organizer = {
        email: 'user1@demo.open-paas.org',
        displayName: 'user1'
      };
      shell.setOrganizerPartStat('ACCEPTED');
      expect(shell.attendees).to.deep.equal([{
        fullmail: 'user1@demo.open-paas.org',
        email: 'user1@demo.open-paas.org',
        name: 'user1@demo.open-paas.org',
        partstat: 'ACCEPTED',
        displayName: 'user1@demo.open-paas.org'
      }]);
    });

    it('should add an attendee when id is not undefined ', function() {
      var attendee = {
        id: '123',
        email: 'disisemail'
      };
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      shell.attendees = [attendee];

      expect(shell.attendees).to.deep.equal([{
        fullmail: 'disisemail',
        email: 'disisemail',
        name: 'disisemail',
        partstat: 'NEEDS-ACTION',
        displayName: 'disisemail'
      }]);
    });

    it('should replace the attendee for organizer with a new one with specified partstat', function() {
      var shell = {
        start: calMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: calMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      shell.organizer = {
        email: 'user1@demo.open-paas.org',
        displayName: 'user1'
      };
      shell.attendees = [{
        fullmail: 'user1@demo.open-paas.org',
        email: 'user1@demo.open-paas.org',
        name: 'user1@demo.open-paas.org',
        partstat: 'NEEDS-ACTION',
        displayName: 'user1@demo.open-paas.org'
      }];
      shell.setOrganizerPartStat('DECLINED');
      expect(shell.attendees).to.deep.equal([{
        fullmail: 'user1@demo.open-paas.org',
        email: 'user1@demo.open-paas.org',
        name: 'user1@demo.open-paas.org',
        partstat: 'DECLINED',
        displayName: 'user1@demo.open-paas.org'
      }]);
    });
  });

  describe('changeParticipation', function() {
    var shell;

    beforeEach(function() {
      shell = CalendarShell.fromIncompleteShell({});
    });

    it('should do nothing if the event has no attendees', function() {
      shell.changeParticipation('ACCEPTED');
      expect(shell.attendees).to.deep.equal([]);
    });

    it('should change all needed attendees partstat and return true', function() {
      shell.attendees = [{
        email: 'user1@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }, {
        email: 'user2@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }, {
        email: 'user3@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }];
      expect(shell.changeParticipation('ACCEPTED')).to.be.true;
      expect(shell.attendees).to.shallowDeepEqual([{
        email: 'user1@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }, {
        email: 'user2@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }, {
        email: 'user3@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }]);
    });

    it('should not change organizer partstat', function() {
      shell.attendees = [{
        email: 'user1@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }, {
        email: 'user2@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }];
      shell.organizer = {
        email: 'user1@demo.open-paas.org',
        displayName: 'user1'
      };
      expect(shell.changeParticipation('ACCEPTED')).to.be.false;
      expect(shell.attendees).to.shallowDeepEqual([{
        email: 'user1@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }, {
        email: 'user2@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }]);
    });

    it('should return false if no attendee partstat was modified', function() {
      shell.attendees = [{
        email: 'user1@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }, {
        email: 'user2@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }];
      expect(shell.changeParticipation('ACCEPTED')).to.be.false;
    });

    describe('when emails parameter is provided', function() {
      it('should do nothing if the event has no attendees', function() {
        shell.changeParticipation('ACCEPTED', ['user1@demo.open-paas.org']);
        expect(shell.attendees).to.deep.equal([]);
      });

      it('should change all needed attendees partstat and return true', function() {
        shell.attendees = [{
          email: 'user1@demo.open-paas.org',
          partstat: 'NEEDS-ACTION'
        }, {
          email: 'user2@demo.open-paas.org',
          partstat: 'NEEDS-ACTION'
        }, {
          email: 'user3@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }];
        expect(shell.changeParticipation('ACCEPTED', ['user1@demo.open-paas.org'])).to.be.true;
        expect(shell.attendees).to.shallowDeepEqual([{
          email: 'user1@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }, {
          email: 'user2@demo.open-paas.org',
          partstat: 'NEEDS-ACTION'
        }, {
          email: 'user3@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }]);
      });

      it('should not change organizer partstat', function() {
        shell.attendees = [{
          email: 'user1@demo.open-paas.org',
          partstat: 'NEEDS-ACTION'
        }, {
          email: 'user2@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }];
        shell.organizer = {
          email: 'user1@demo.open-paas.org',
          displayName: 'user1'
        };
        expect(shell.changeParticipation('ACCEPTED'), ['user1@demo.open-paas.org']).to.be.false;
        expect(shell.attendees).to.shallowDeepEqual([{
          email: 'user1@demo.open-paas.org',
          partstat: 'NEEDS-ACTION'
        }, {
          email: 'user2@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }]);
      });

      it('should return false if no attendee partstat was modified', function() {
        shell.attendees = [{
          email: 'user1@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }, {
          email: 'user2@demo.open-paas.org',
          partstat: 'ACCEPTED'
        }];
        expect(shell.changeParticipation('ACCEPTED'), ['user1@demo.open-paas.org']).to.be.false;
      });
    });
  });

  describe('RRule property', function() {

    it('should set rrule', function() {
      var rrule = {
        freq: 'WEEKLY'
      };

      var shell = new CalendarShell.fromIncompleteShell({rrule: rrule});

      expect(shell.rrule.freq).to.be.equal('WEEKLY');
    });

    it('should set rrule to undefined', function() {
      var rrule = {
        freq: 'WEEKLY'
      };
      var shell = new CalendarShell.fromIncompleteShell({rrule: rrule});

      expect(shell.rrule).to.exist;

      shell.rrule = undefined;
      expect(shell.rrule).to.be.undefined;
    });
  });

  describe('isMeeting function', function() {
    var shell;

    beforeEach(function() {
      shell = CalendarShell.fromIncompleteShell({});
    });

    it('should return true if the event has attendees', function() {
      shell.attendees = [{
        email: 'organizer@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }, {
        email: 'user1@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }, {
        email: 'user2@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }];

      expect(shell.isMeeting()).to.be.true;
    });

    it('should return false if the event has not any attendees', function() {
      shell.attendees = [{
        email: 'organizer@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }];

      expect(shell.isMeeting()).to.be.false;
    });
  });

  describe('isOverOneDayOnly function', function() {

    describe('when simple event', function() {

      it('should return true if the start day and the end day are equal', function() {
        var event = CalendarShell.fromIncompleteShell({
          start: calMoment('2016-11-23 09:00:00'),
          end: calMoment('2016-11-23 10:00:00')
        });

        expect(event.isOverOneDayOnly()).to.be.true;
      });

      it('should return true if the event finish in the next day at 12 am ', function() {
        var event = CalendarShell.fromIncompleteShell({
          start: calMoment('2016-11-23 09:00:00'),
          end: calMoment('2016-11-24 00:00:00')
        });

        expect(event.isOverOneDayOnly()).to.be.true;
      });

      it('should return false if the start day and the end day are not equal', function() {
        var event = CalendarShell.fromIncompleteShell({
          start: calMoment('2016-11-23 09:00:00'),
          end: calMoment('2016-11-24 10:00:00')
        });

        expect(event.isOverOneDayOnly()).to.be.false;
      });
    });

    describe('when allDay event', function() {

      it('should return true if the start day and the end day are equal', function() {
        var event = CalendarShell.fromIncompleteShell({
          start: calMoment('2016-11-23'),
          end: calMoment('2016-11-24')
        });

        expect(event.isOverOneDayOnly()).to.be.true;
      });

      it('should return false if the start day and the end day are not equal', function() {
        var event = CalendarShell.fromIncompleteShell({
          start: calMoment('2016-11-23'),
          end: calMoment('2016-11-25')
        });

        expect(event.isOverOneDayOnly()).to.be.false;
      });
    });
  });

  describe('The getRecurrenceType function', function() {

    it('should return the empty String when the event is not recurring', function() {
      expect(loadICSFixtureAsCalendarShell('event.ics').getRecurrenceType()).to.equal('');
    });

    it('should the RRULE frequence when the event is recurring', function() {
      expect(loadICSFixtureAsCalendarShell('recurringEventWithTwoExceptions.ics').getRecurrenceType()).to.equal('DAILY');
    });

  });

  describe('The getExceptionByRecurrenceId function', function() {

    it('should return nothing when the event is not recurring', function() {
      expect(loadICSFixtureAsCalendarShell('event.ics').getExceptionByRecurrenceId('123')).to.equal(undefined);
    });

    it('should return nothing when the exception is not found is not recurring', function() {
      expect(loadICSFixtureAsCalendarShell('recurringEventWithTwoExceptions.ics').getExceptionByRecurrenceId('123')).to.equal(undefined);
    });

    it('should return the exception when the exception is found', function() {
      expect(loadICSFixtureAsCalendarShell('recurringEventWithTwoExceptions.ics').getExceptionByRecurrenceId('20170113T100000Z').uid)
        .to.equal('cbdf2ff0-c6e0-413f-8984-0f70a86e9866');
    });

  });

});
