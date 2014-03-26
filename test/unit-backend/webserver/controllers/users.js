'use strict';

var expect = require('chai').expect;

describe('The User controller', function() {

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('The logmein fn', function() {
    it('should redirect to / if user is set in request', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/');
          done();
        }
      };
      users.logmein(req, res);
    });

    it('should return HTTP 500 if user email is not defined', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        user: {
        }
      };
      var res = {
        send: function(status) {
          expect(status).to.equal(500);
          done();
        }
      };
      users.logmein(req, res);
    });

    it('should return HTTP 500 if user is not set in request', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {};
      var res = {
        send: function(status) {
          expect(status).to.equal(500);
          done();
        }
      };
      users.logmein(req, res);
    });
  });
});
