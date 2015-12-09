'use strict';

var expect = require('chai').expect;

describe('The calendar middlewares', function() {
  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
  });

  describe('the decodeJWT middleware', function() {
    beforeEach(function() {
      this.check400 = function(req, done) {
        var res = {
          status: function(status) {
            expect(status).to.equal(400);
            return {
              json: function(error) {
                expect(error).to.exist;
                done();
              }
            };
          }
        };
        var middlewares = require(this.calendarModulePath + '/backend/webserver/api/calendar/middleware')(this.moduleHelpers.dependencies);
        middlewares.decodeJWT(req, res, function() {
          done('Next should not have been called');
        });
      };
    });

    it('should send 400 if req has no calendarId', function(done) {
      var req = {
        user: {
          event: 'event',
          attendeeEmail: 'attendeeEmail',
          action: 'action',
          organizerEmail: 'organizerEmail'
        }
      };
      this.check400(req, done);
    });

    it('should send 400 if req has no event', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          attendeeEmail: 'attendeeEmail',
          action: 'action',
          organizerEmail: 'organizerEmail'
        }
      };
      this.check400(req, done);
    });

    it('should send 400 if req has no attendeeEmail', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          event: 'event',
          action: 'action',
          organizerEmail: 'organizerEmail'
        }
      };
      this.check400(req, done);
    });

    it('should send 400 if req has no action', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          event: 'event',
          attendeeEmail: 'attendeeEmail',
          organizerEmail: 'organizerEmail'
        }
      };
      this.check400(req, done);
    });

    it('should send 400 if req has no organizerEmail', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          event: 'event',
          attendeeEmail: 'attendeeEmail',
          action: 'action'
        }
      };
      this.check400(req, done);
    });

    it('should send 400 if req.organizerEmail could not be found as a ESN user', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          event: 'event',
          attendeeEmail: 'attendeeEmail',
          action: 'action',
          organizerEmail: 'organizerEmail'
        }
      };

      var userModuleMock = {
        findByEmail: function(email, callback) {
          expect(email).to.equal(req.user.organizerEmail);
          return callback();
        }
      };
      this.moduleHelpers.addDep('user', userModuleMock);
      this.check400(req, done);
    });

    it('should send 500 if an error happens while searching for req.organizerEmail as a ESN user', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          event: 'event',
          attendeeEmail: 'attendeeEmail',
          action: 'action',
          organizerEmail: 'organizerEmail'
        }
      };

      var userModuleMock = {
        findByEmail: function(email, callback) {
          expect(email).to.equal(req.user.organizerEmail);
          return callback(new Error());
        }
      };
      this.moduleHelpers.addDep('user', userModuleMock);
      var res = {
        status: function(status) {
          expect(status).to.equal(500);
          return {
            json: function(error) {
              expect(error).to.exist;
              done();
            }
          };
        }
      };
      var middlewares = require(this.calendarModulePath + '/backend/webserver/api/calendar/middleware')(this.moduleHelpers.dependencies);
      middlewares.decodeJWT(req, res, function() {
        done('Next should not have been called');
      });
    });

    it('should call next if all the required properties are present and valid', function(done) {
      var req = {
        user: {
          calendarId: 'calendarId',
          event: 'event',
          attendeeEmail: 'attendeeEmail',
          action: 'action',
          organizerEmail: 'organizerEmail'
        }
      };

      var userModuleMock = {
        findByEmail: function(email, callback) {
          expect(email).to.equal(req.user.organizerEmail);
          return callback(null, {_id: 'userId'});
        }
      };
      this.moduleHelpers.addDep('user', userModuleMock);

      var middlewares = require(this.calendarModulePath + '/backend/webserver/api/calendar/middleware')(this.moduleHelpers.dependencies);
      middlewares.decodeJWT(req, null, done);
    });

  });

});
