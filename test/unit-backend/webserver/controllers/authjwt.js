'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

function setupMocks(jwt) {
  mockery.registerMock('../../core/auth/jwt', jwt || {});
}

describe('The authjwt controller', function() {

  var self;

  beforeEach(function() {
    self = this;
  });

  describe('The generateWebToken function', function() {

    it('should return HTTP 500 if jwt.generateWebToken sends back error', function(done) {

      var jwt = {
        generateWebToken: function(payload, callback) {
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
        generateWebToken: function(payload, callback) {
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
        generateWebToken: function(payload, callback) {
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

    function testJwtToContainsPayload(done, req, expectedPayload) {

      var jwt = {
        generateWebToken: function(payload, callback) {
          expect(payload).to.deep.equal(expectedPayload);
          done();
          return callback(null, {});
        }
      };
      setupMocks(jwt);

      var controller = self.helpers.requireBackend('webserver/controllers/authjwt');

      var res = {
        status: function() {
          return { json: function() {} };
        }
      };

      controller.generateWebToken(req, res);
    }

    it('should not contain the subject when the request has no user', function(done) {
      testJwtToContainsPayload(done, {}, {});
    });

    it('should not contain the subject when the request has an user without preferred email', function(done) {
      testJwtToContainsPayload(done, {
        user: {}
      }, {});
    });

    it('should contain the subject when the request has an user with preferred email', function(done) {
      testJwtToContainsPayload(done, {
        user: {
          preferredEmail: 'expected@email'
        }
      }, {sub: 'expected@email'});
    });
  });

});
