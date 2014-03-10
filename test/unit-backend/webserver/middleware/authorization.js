'use strict';

describe('The authorization middleware', function() {

  describe('The requiresAPILogin fn', function() {

    it('should send an error if user is not autenticated', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      var res = {
        json: function(code, error) {
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should call next if user is autenticated', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return true;
        }
      };
      var res = {
      };
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });
  });
});
