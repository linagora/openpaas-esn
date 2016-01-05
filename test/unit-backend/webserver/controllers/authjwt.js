'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

function setupMocks(jwt, user, technicaluser) {
  mockery.registerMock('../../core/auth/jwt', jwt || {});
  mockery.registerMock('../../core/user', user || {});
  mockery.registerMock('../../core/technical-user', technicaluser || {});
  mockery.registerMock('./utils', {
    sanitizeUser: function(user) {
      return user;
    },
    sanitizeTechnicalUser: function(user) {
      return user;
    }
  });
}

describe('The authjwt controller', function() {

  describe('The generateWebToken function', function() {
    it('should return HTTP 500 if jwt.generateWebToken sends back error', function(done) {

      var jwt = {
        generateWebToken: function(options, callback) {
          return callback(new Error());
        }
      };
      setupMocks(jwt);

      var controller = this.helpers.requireBackend('webserver/controllers/authjwt');
      var req = {
        user: {
          _id: '123'
        }
      };
      var res = {
        status: function(status) {
          expect(status).to.equal(500);
          return {
            json: function() {
              done();
            }
          };
        }
      };
      controller.generateWebToken(req, res);
    });

    it('should return HTTP 500 if jwt.generateWebToken sends back empty token', function(done) {

      var jwt = {
        generateWebToken: function(options, callback) {
          return callback(null, null);
        }
      };
      setupMocks(jwt);

      var controller = this.helpers.requireBackend('webserver/controllers/authjwt');
      var req = {
        user: {
          _id: '123'
        }
      };
      var res = {
        status: function(status) {
          expect(status).to.equal(500);
          return {
            json: function() {
              done();
            }
          };
        }
      };
      controller.generateWebToken(req, res);
    });

    it('should return HTTP 200 if jwt.generateWebToken sends back token', function(done) {

      var jwt = {
        generateWebToken: function(options, callback) {
          return callback(null, {});
        }
      };
      setupMocks(jwt);

      var controller = this.helpers.requireBackend('webserver/controllers/authjwt');
      var req = {
        user: {
          _id: '123'
        }
      };
      var res = {
        status: function(status) {
          expect(status).to.equal(200);
          return {
            json: function() {
              done();
            }
          };
        }
      };
      controller.generateWebToken(req, res);
    });

  });

});
