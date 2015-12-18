'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var fs = require('fs');
var ICAL = require('ical.js');

describe('The calendar controller', function() {

  beforeEach(function() {
    mockery.registerMock('./core', function() {});
    this.moduleHelpers.addDep('helpers', {});
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
  });

  describe('the modifyParticipation function', function() {
    it('should send 400 if the attendee does not exist in the vevent', function(done) {
      var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/noAttendee.ics').toString('utf8');
      var req = {
        eventPayload: {
          event: ics
        },
        user: {
          _id: 'c3po'
        }
      };
      var res = {
        status: function(status) {
          expect(status).to.equal(400);
          return {
            json: function(err) {
              expect(err).to.exist;
              done();
            }
          };
        }
      };
      var controller = require(this.calendarModulePath + '/backend/webserver/api/calendar/controller')(this.moduleHelpers.dependencies);
      controller.changeParticipation(req, res);
    });

    describe('when the vevent has the attendee', function() {
      var req, vcalendar;

      beforeEach(function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting.ics').toString('utf8');
        vcalendar = ICAL.Component.fromString(ics);
        req = {
          eventPayload: {
            event: ics,
            calendarURI: 'events',
            attendeeEmail: 'janedoe@open-paas.org',
            action: 'ACCEPTED'
          },
          user: {
            _id: 'c3po'
          },
          davserver: 'http://davserver',
          headers: ['header1', 'header2']
        };
      });

      it('should send a request to the davserver, and return 500 if request fails', function(done) {
        var requestMock = function(options, callback) {
          expect(options.method).to.equal('PUT');
          expect(options.url).to.equal([
            req.davserver,
            'calendars',
            req.user._id,
            req.eventPayload.calendarURI,
            vcalendar.getFirstSubcomponent('vevent').getFirstPropertyValue('uid') + '.ics'
          ].join('/'));
          expect(options.body).to.exist;
          return callback(new Error());
        };
        mockery.registerMock('request', requestMock);

        var res = {
          status: function(status) {
            expect(status).to.equal(500);
            return {
              json: function(err) {
                expect(err).to.exist;
                done();
              }
            };
          }
        };
        var controller = require(this.calendarModulePath + '/backend/webserver/api/calendar/controller')(this.moduleHelpers.dependencies);
        controller.changeParticipation(req, res);
      });

      it('should send a request to the davserver, and return 200 if request succeeds', function(done) {
        var requestMock = function(options, callback) {
          expect(options.method).to.equal('PUT');
          expect(options.url).to.equal([
            req.davserver,
            'calendars',
            req.user._id,
            req.eventPayload.calendarURI,
            vcalendar.getFirstSubcomponent('vevent').getFirstPropertyValue('uid') + '.ics'
          ].join('/'));
          expect(options.body).to.exist;
          return callback(null, {statusCode: 200});
        };
        mockery.registerMock('request', requestMock);

        var res = {
          status: function(status) {
            expect(status).to.equal(200);
            return {
              end: done
            };
          }
        };
        var controller = require(this.calendarModulePath + '/backend/webserver/api/calendar/controller')(this.moduleHelpers.dependencies);
        controller.changeParticipation(req, res);
      });
    });

  });

});
