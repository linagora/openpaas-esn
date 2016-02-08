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
    var req, vcalendar, ics, etag, callbackAfterGetDone, requestMock, maxNumTry, setGetRequest;

    beforeEach(function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting.ics').toString('utf8');
      vcalendar = ICAL.Component.fromString(ics);
      req = {
        eventPayload: {
          event: ics,
          calendarURI: 'events',
          attendeeEmail: 'janedoe@open-paas.org',
          uid: vcalendar.getFirstSubcomponent('vevent').getFirstPropertyValue('uid'),
          action: 'ACCEPTED'
        },
        user: {
          _id: 'c3po'
        },
        davserver: 'http://davserver',
        headers: ['header1', 'header2']
      };

      maxNumTry = 12;
      etag = 2;
      callbackAfterGetDone = function() { };
      setGetRequest = function() {
        requestMock = function(options, callback) {
          callbackAfterGetDone();
          return callback(null, {
            headers: {etag: etag},
            body: ics
          });
        };

        mockery.registerMock('request', function(options, callback) {
          requestMock(options, callback);
        });
      };

      setGetRequest();
    });

    it('should send 400 if the attendee does not exist in the vevent', function(done) {
      var req = {
        eventPayload: {
          calendarURI: 'uri',
          uid: 'uid'
        },
        user: {
          _id: 'c3po'
        },
        davserver: 'davserver'
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
      it('should send a request to the davserver to fetch the event, and return 500 if request fails', function(done) {
        requestMock = function(options, callback) {
          expect(options.method).to.equal('GET');
          expect(options.url).to.equal([
              req.davserver,
              'calendars',
              req.user._id,
              req.eventPayload.calendarURI,
              req.eventPayload.uid + '.ics'
          ].join('/'));
          return callback(new Error());
        };

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

      describe('request if first get request work', function() {
        it('should send a put request to davserver with If-Match, and return 500 if it fails without 412', function(done) {
          callbackAfterGetDone = function() {
            requestMock = function(options, callback) {
              expect(options.method).to.equal('PUT');
              expect(options.headers['If-Match']).to.equal(etag);
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
          };

          var controller = require(this.calendarModulePath + '/backend/webserver/api/calendar/controller')(this.moduleHelpers.dependencies);

          var res = {
            status: function(status) {
              expect(status).to.equal(500);
              return {
                json: function(err) {
                  expect(err).to.exist;
                  return {
                    end: function() {
                      done();
                    }
                  };
                }
              };
            }
          };

          controller.changeParticipation(req, res);
        });

        it('should retry doing put if 412 up to 12 time', function(done) {
          var time = 0;
          callbackAfterGetDone = function() {
            requestMock = function(options, callback) {
              time++;
              expect(options.method).to.equal('PUT');
              expect(options.headers['If-Match']).to.equal(etag);
              expect(options.url).to.equal([
                  req.davserver,
                  'calendars',
                  req.user._id,
                  req.eventPayload.calendarURI,
                  vcalendar.getFirstSubcomponent('vevent').getFirstPropertyValue('uid') + '.ics'
              ].join('/'));
              expect(options.body).to.exist;
              setGetRequest();
              return callback(null, {statusCode: time === 12 ? 200 : 412});
            };

            mockery.registerMock('request', requestMock);
          };

          var controller = require(this.calendarModulePath + '/backend/webserver/api/calendar/controller')(this.moduleHelpers.dependencies);

          var res = {
            status: function(status) {
              expect(status).to.equal(200);
              return {
                end: function() {
                  done();
                }
              };
            }
          };

          controller.changeParticipation(req, res);
        });

        it('should fail if put fail with 412 more than 12 time', function(done) {
          var time = 0;
          callbackAfterGetDone = function() {
            requestMock = function(options, callback) {
              time++;
              expect(options.method).to.equal('PUT');
              expect(options.headers['If-Match']).to.equal(etag);
              expect(options.url).to.equal([
                  req.davserver,
                  'calendars',
                  req.user._id,
                  req.eventPayload.calendarURI,
                  vcalendar.getFirstSubcomponent('vevent').getFirstPropertyValue('uid') + '.ics'
              ].join('/'));
              expect(options.body).to.exist;
              setGetRequest();
              return callback(null, {statusCode: time === 12 ? 200 : 412});
            };

            mockery.registerMock('request', requestMock);
          };

          var controller = require(this.calendarModulePath + '/backend/webserver/api/calendar/controller')(this.moduleHelpers.dependencies);

          var res = {
            status: function(status) {
              expect(status).to.equal(200);
              return {
                end: function() {
                  done();
                }
              };
            }
          };

          controller.changeParticipation(req, res);
        });

      });
    });
  });
});
