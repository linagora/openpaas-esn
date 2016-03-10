'use strict';

/* global chai: false */
/* global sinon: false */
/* global jstz: false */

var expect = chai.expect;

describe('CalendarShell factory', function() {
  var CalendarShell, fcMoment, ICAL, $rootScope;

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

    this.eventApiMock = {

    };

    this.masterEventCache = {};

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('jstz', self.jstz);
      $provide.value('uuid4', self.uuid4);
      $provide.value('eventAPI', self.eventApiMock);
      $provide.value('masterEventCache', self.masterEventCache);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_CalendarShell_, _fcMoment_, _ICAL_, _$rootScope_) {
      CalendarShell = _CalendarShell_;
      fcMoment = _fcMoment_;
      ICAL = _ICAL_;
      $rootScope = _$rootScope_;
    });
  });

  describe('Attendees', function() {
    it('should allow several attendee properties', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
                  tzid: 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T18:00:00'
              ],
              [
                'dtend',
                {
                  tzid: 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T19:00:00'
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
          ]
        ]
      ];
    }

    it('should correctly create a recurrent event : daily + interval + count', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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

  describe('isRecurring method', function() {
    it('should return true for reccuring event', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.isRecurring()).to.be.false;
    });
  });

  describe('expand method', function() {

    function formatDates(event) {
      event.formattedStart = event.start.format('YYYY-MM-DD HH:MM');
      event.formattedEnd = event.end.format('YYYY-MM-DD HH:MM');
      return event;
    }

    it('should return an empty array for non recurring event', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0))
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.expand()).to.deep.equal([]);
    });

    it('should fail if called without end date and max element if the event have a infinity of sub event', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
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
        start: fcMoment.tz('2015-01-01 18:01', 'America/Toronto'),
        end: fcMoment('2015-01-01 19:01', 'America/Toronto'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 1
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);
      shell.vevent.getFirstProperty('dtstart').setParameter('tzid', jstz.determine().name()); //fcMoment.tz does not use fake timezone by our jstz mock
      expect(shell.expand()[0].vevent.getFirstPropertyValue('recurrence-id').toString()).to.equals('2015-01-01T23:01:00Z');
    });

    it('should expand correctly all subevent if no start end zone specified', function() {
      var shell = {
        start: fcMoment('2015-01-01 18:01'),
        end: fcMoment('2015-01-01 19:01'),
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
          formattedStart: '2015-01-01 18:01',
          formattedEnd: '2015-01-01 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        1: {
          title: 'reccurent',
          formattedStart: '2015-01-03 18:01',
          formattedEnd: '2015-01-03 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        2: {
          title: 'reccurent',
          formattedStart: '2015-01-05 18:01',
          formattedEnd: '2015-01-05 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 3
      });
    });

    it('should expand correctly all subevent before enddate if no startDate given', function() {
      var shell = {
        start: fcMoment('2015-01-01 18:01'),
        end: fcMoment('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(null, fcMoment('2015-01-02')).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-01 18:01',
          formattedEnd: '2015-01-01 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand correctly all subevent after start if no enddate given', function() {
      var shell = {
        start: fcMoment('2015-01-01 18:01'),
        end: fcMoment('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(fcMoment('2015-01-04')).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-05 18:01',
          formattedEnd: '2015-01-05 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand correctly all subevent between start date and end date', function() {
      var shell = {
        start: fcMoment('2015-01-01 18:01'),
        end: fcMoment('2015-01-01 19:01'),
        backgroundColor: 'red',
        title: 'reccurent',
        rrule: {
          freq: 'DAILY',
          interval: 2
        }
      };

      shell = CalendarShell.fromIncompleteShell(shell);

      expect(shell.expand(fcMoment('2015-01-02'), fcMoment('2015-01-04')).map(formatDates)).to.shallowDeepEqual({
        0: {
          title: 'reccurent',
          formattedStart: '2015-01-03 18:01',
          formattedEnd: '2015-01-03 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 1
      });
    });

    it('should expand no more event than given maxElement', function() {
      var shell = {
        start: fcMoment('2015-01-01 18:01'),
        end: fcMoment('2015-01-01 19:01'),
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
          formattedStart: '2015-01-01 18:01',
          formattedEnd: '2015-01-01 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        1: {
          title: 'reccurent',
          formattedStart: '2015-01-03 18:01',
          formattedEnd: '2015-01-03 19:01',
          backgroundColor: 'red',
          rrule: undefined
        },
        length: 2
      });
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
      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: fcMoment()
      });

      var masterFromCache = CalendarShell.fromIncompleteShell({});
      this.masterEventCache.getMasterEvent = sinon.stub().returns(masterFromCache);
      this.masterEventCache.saveMasterEvent = sinon.spy();

      var self = this;
      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell).to.equal(masterFromCache);
        expect(self.masterEventCache.getMasterEvent).to.have.been.calledWith(shell.path);
        expect(self.masterEventCache.saveMasterEvent).to.have.been.calledWith(masterFromCache);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should fetch the master on the server if not already cached', function(done) {
      var path = 'this is a path';
      var vcalendar = CalendarShell.fromIncompleteShell({}).vcalendar;
      var gracePeriodTaskId = 'gracePeriodID';
      var etag = 'eta';

      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: fcMoment(),
        path: path,
        etag: etag,
        gracePeriodTaskId: gracePeriodTaskId
      });

      this.masterEventCache.getMasterEvent = sinon.stub().returns(null);
      this.masterEventCache.saveMasterEvent = sinon.spy();

      this.eventApiMock.get = function(_path) {
        expect(_path).to.equal(path);
        return $q.when({data: vcalendar.toJSON()});
      };

      var self = this;
      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell.vcalendar.toJSON()).to.deep.equal(vcalendar.toJSON());
        expect(masterShell.etag).to.equal(etag);
        expect(masterShell.gracePeriodTaskId).to.equal(gracePeriodTaskId);
        expect(self.masterEventCache.getMasterEvent).to.have.been.calledWith(shell.path);
        expect(self.masterEventCache.saveMasterEvent).to.have.been.calledWith(masterShell);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should fail if fetching the master on the server has failed', function(done) {

      var error = {};

      this.eventApiMock.get = function() {
        return $q.reject(error);
      };

      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: fcMoment()
      });

      this.masterEventCache.getMasterEvent = function(path) {
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

  describe('modifyOccurence method', function() {

    it('should failed if called on a non master event', function(done) {
      var nonMasterEvent = CalendarShell.fromIncompleteShell({
        recurrenceId: fcMoment()
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
        recurrenceId: fcMoment()
      });
      this.masterEventCache.saveMasterEvent = sinon.spy();

      var masterEvent = CalendarShell.fromIncompleteShell({});
      masterEvent.modifyOccurrence(nonMasterEvent);

      var vevents = masterEvent.vcalendar.getAllSubcomponents('vevent');
      expect(vevents.length).to.equal(2);

      var numSame = 0;
      vevents.forEach(function(vevent) {
        numSame += angular.equals(vevent.toJSON(), nonMasterEvent.vevent.toJSON()) ? 1 : 0;
      });
      expect(numSame).to.equal(1);
      expect(this.masterEventCache.saveMasterEvent).to.have.been.calledWith(masterEvent);
    });

    it('should replace the modified occurence in the vcalendar of the master shell if already there', function() {
      var recurrenceId = fcMoment();
      this.masterEventCache.saveMasterEvent = sinon.spy();

      var nonMasterEvent = CalendarShell.fromIncompleteShell({
        recurrenceId: recurrenceId
      });

      var nonMasterEventModified = CalendarShell.fromIncompleteShell({
        recurrenceId: recurrenceId,
        start: fcMoment()
      });

      var masterEvent = CalendarShell.fromIncompleteShell({});

      masterEvent.modifyOccurrence(nonMasterEvent);

      masterEvent.modifyOccurrence(nonMasterEventModified);

      var vevents = masterEvent.vcalendar.getAllSubcomponents('vevent');
      expect(vevents.length).to.equal(2);
      var numSame = 0;

      vevents.forEach(function(vevent) {
        numSame += angular.equals(vevent.toJSON(), nonMasterEventModified.vevent.toJSON()) ? 1 : 0;
      });

      expect(numSame).to.equal(1);
      expect(this.masterEventCache.saveMasterEvent).to.have.been.calledWith(masterEvent);
    });

  });

  describe('equals method', function() {
    it('should return call isSame for start, end and recurrenceId properties', function() {
      var eventA = CalendarShell.fromIncompleteShell({
        start: fcMoment('2015-01-01 18:00'),
        end: fcMoment('2015-01-01 18:00'),
        recurrendId: fcMoment('2015-01-01 18:00')
      });
      var eventB = CalendarShell.fromIncompleteShell({
        start: fcMoment('2015-01-01 18:00'),
        end: fcMoment('2015-01-01 18:00'),
        recurrendId: fcMoment('2015-01-01 18:00')
      });

      eventA.start.foo = 'bar';
      eventA.end.foo = 'bar';
      eventA.recurrendId.foo = 'bar';
      expect(eventA.equals(eventB)).to.be.true;
    });
  });

});
