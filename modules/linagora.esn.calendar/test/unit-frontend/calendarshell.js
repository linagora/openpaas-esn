'use strict';

/* global chai: false */

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

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('jstz', self.jstz);
      $provide.value('uuid4', self.uuid4);
      $provide.value('eventAPI', self.eventApiMock);
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

    it('should return the master if present in the parent vcalendar', function(done) {
      var shell = CalendarShell.fromIncompleteShell({
        recurrenceId: fcMoment()
      });

      var masterVevent = CalendarShell.fromIncompleteShell({}).vevent;

      shell.vcalendar.addSubcomponent(masterVevent);

      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell.vevent).to.equal(masterVevent);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should fetch the master on the server if not already present in the parent vcalendar', function(done) {
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

      this.eventApiMock.get = function(_path) {
        expect(_path).to.equal(path);
        return $q.when({data: vcalendar.toJSON()});
      };

      shell.getModifiedMaster().then(function(masterShell) {
        expect(masterShell.vcalendar.toJSON()).to.deep.equal(vcalendar.toJSON());
        expect(masterShell.etag).to.equal(etag);
        expect(masterShell.gracePeriodTaskId).to.equal(gracePeriodTaskId);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should fail if fetching the master on the server has failed', function(done) {

      var error = {};

      this.eventApiMock.get = function() {
        return $q.reject(error);
      };

      CalendarShell.fromIncompleteShell({
        recurrenceId: fcMoment()
      }).getModifiedMaster().then(
        done.bind(this, 'this promess should have failed'),
      function(_error) {
        expect(_error).to.equal(error);
        done();
      });

      $rootScope.$apply();
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

      var masterEvent = CalendarShell.fromIncompleteShell({});
      masterEvent.modifyOccurrence(nonMasterEvent);

      var vevents = masterEvent.vcalendar.getAllSubcomponents('vevent');
      expect(vevents.length).to.equal(2);

      var numSame = 0;
      vevents.forEach(function(vevent) {
        numSame += angular.equals(vevent.toJSON(), nonMasterEvent.vevent.toJSON()) ? 1 : 0;
      });
      expect(numSame).to.equal(1);
    });

    it('should replace the modified occurence in the vcalendar of the master shell if already there', function() {
      var recurrenceId = fcMoment();

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
    });

  });

});
