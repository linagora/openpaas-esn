'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module', function() {

  describe('The calendarService service', function() {
    var ICAL;

    beforeEach(function() {
      var self = this;
      this.tokenAPI = {
        getNewToken: function() {
          return {
            then: function(callback) {
              self.tokenAPI.callback = callback;
            }
          };
        }
      };
      this.uuid4 = {
        // This is a valid uuid4. Change this if you need other uuids generated.
        _uuid: '00000000-0000-4000-a000-000000000000',
        generate: function() {
          return this._uuid;
        }
      };

      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
        $provide.value('uuid4', self.uuid4);
      });
    });

    beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, _ICAL_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.calendarService = calendarService;

      ICAL = _ICAL_;
    }));

    describe('The list fn', function() {
      it('should list events', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        var data = {
          match: { start: '20140101T000000', end: '20140102T000000' },
          scope: { calendars: ['/path/to/calendar'] }
        };
        this.$httpBackend.expectPOST('/json/queries/time-range', data).respond([
          ['vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'myuid'],
              ['summary', {}, 'text', 'title'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
            ], []]
          ]]
        ]);

        var start = new Date(2014, 0, 1);
        var end = new Date(2014, 0, 2);

        this.calendarService.list('/path/to/calendar', start, end, false).then(function(events) {
            expect(events).to.be.an.array;
            expect(events.length).to.equal(1);
            expect(events[0].id).to.equal('myuid');
            expect(events[0].title).to.equal('title');
            expect(events[0].start.getTime()).to.equal(new Date(2014, 0, 1, 2, 3, 4).getTime());
            expect(events[0].end.getTime()).to.equal(new Date(2014, 0, 1, 3, 3, 4).getTime());
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });
    });

    describe('The getEvent fn', function() {
      it('should return an event', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        this.$httpBackend.expectGET('/path/to/event.ics').respond(
          ['vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'myuid'],
              ['summary', {}, 'text', 'title'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
            ], []]
          ]]
        );

        this.calendarService.getEvent('path/to/event.ics').then(function(event) {
            expect(event).to.be.an('object');
            expect(event.id).to.equal('myuid');
            expect(event.title).to.equal('title');
            expect(event.start.getTime()).to.equal(new Date(2014, 0, 1, 2, 3, 4).getTime());
            expect(event.end.getTime()).to.equal(new Date(2014, 0, 1, 3, 3, 4).getTime());
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });
    });

    describe('The create fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      it('should fail on missing vevent', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        this.calendarService.create('/path/to/uid.ics', vcalendar).then(
          unexpected.bind(null, done), function(e) {
            expect(e.message).to.equal('Missing VEVENT in VCALENDAR');
            done();
          }
        );
        this.$rootScope.$apply();
      });

      it('should fail on missing uid', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vcalendar.addSubcomponent(vevent);

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          unexpected.bind(null, done), function(e) {
            expect(e.message).to.equal('Missing UID in VEVENT');
            done();
          }
        );
        this.$rootScope.$apply();
      });

      it.only('should fail on 500 response status', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('//path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(500, '');

        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(500);
            done();
          }
        );

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });

      it('should fail on a 2xx status that is not 201', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('//path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, '');

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(200);
            done();
          }
        );

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });

      it('should succeed when everything is correct', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('//path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(201, vcalendar.toJSON());

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          function(response) {
            expect(response.status).to.equal(201);
            expect(response.data).to.deep.equal(vcalendar.toJSON());
            done();
          }
        );

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });
    });

    describe('The shellToICAL fn', function() {
      beforeEach(function() {
        this.compareShell = (function(shell, ical) {
          var vcalendar = this.calendarService.shellToICAL(shell);
          var vevents = vcalendar.getAllSubcomponents();
          expect(vevents.length).to.equal(1);
          var vevent = vevents[0];

          var properties = vevent.getAllProperties();
          var propkeys = properties.map(function(p) {
            return p.name;
          }).sort();
          var icalkeys = Object.keys(ical).sort();

          var message = 'Key count mismatch in ical object.\n' +
                        'expected: ' + icalkeys + '\n' +
                        '   found: ' + propkeys;
          expect(properties.length).to.equal(icalkeys.length, message);

          for (var propName in ical) {
            var value = vevent.getFirstPropertyValue(propName).toString();
            expect(value).to.equal(ical[propName]);
          }
        }).bind(this);
      });

      it('should correctly create an allday event', function() {
        var shell = {
          startDate: new Date('2014-12-29T18:00:00'),
          endDate: new Date('2014-12-29T19:00:00'),
          allday: true,
          title: 'allday event',
          location: 'location',
          description: 'description'
        };
        var ical = {
          uid: '00000000-0000-4000-a000-000000000000',
          dtstart: '2014-12-29',
          dtend: '2014-12-30',
          summary: 'allday event',
          location: 'location',
          description: 'description',
          transp: 'TRANSPARENT'
        };

        this.compareShell(shell, ical);
      });

      it('should correctly create a non-allday event', function() {
        var shell = {
          startDate: new Date(2014, 11, 29, 18, 0, 0),
          endDate: new Date(2014, 11, 29, 19, 0, 0),
          allday: false,
          title: 'non-allday event'
        };
        var ical = {
          uid: '00000000-0000-4000-a000-000000000000',
          dtstart: '2014-12-29T18:00:00',
          dtend: '2014-12-29T19:00:00',
          summary: 'non-allday event',
          transp: 'OPAQUE'
        };

        this.compareShell(shell, ical);
      });
    });
  });
});
