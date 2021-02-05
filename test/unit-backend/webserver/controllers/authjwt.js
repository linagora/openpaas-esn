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
        generateWebToken: function(payload, options, callback) {
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
      var res = self.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      controller.generateWebToken(req, res);
    });

    it('should return HTTP 500 if jwt.generateWebToken sends back empty token', function(done) {

      var jwt = {
        generateWebToken: function(payload, options, callback) {
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
      var res = self.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      controller.generateWebToken(req, res);
    });

    it('should return HTTP 200 if jwt.generateWebToken sends back token', function(done) {

      var jwt = {
        generateWebToken: function(payload, options, callback) {
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
      var res = self.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(200);
          done();
        }
      );
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

      var res = self.helpers.express.jsonResponse(
        function() {
        }
      );

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

    it('should use the expiresIn if specified in the request', function(done) {
      const jwt = {
        generateWebToken: function(payload, options, callback) {
          expect(payload).to.deep.equal({ sub: 'expected@email' });
          expect(options.expiresIn).to.equal('13h');
          done();

          return callback(null, {});
        }
      };

      setupMocks(jwt);

      const controller = self.helpers.requireBackend('webserver/controllers/authjwt');
      const res = self.helpers.express.jsonResponse(() => {});
      const req = {
        user: {
          preferredEmail: 'expected@email'
        },
        query: {
          expiresIn: '13h'
        }
      };

      controller.generateWebToken(req, res);
    });

    it('should use the default expiresIn value if not specified in the request', function(done) {
      const jwt = {
        generateWebToken: function(payload, options, callback) {
          expect(payload).to.deep.equal({ sub: 'expected@email' });
          expect(options.expiresIn).to.equal('12h');
          done();

          return callback(null, {});
        }
      };

      setupMocks(jwt);

      const controller = self.helpers.requireBackend('webserver/controllers/authjwt');
      const res = self.helpers.express.jsonResponse(() => { });
      const req = {
        user: {
          preferredEmail: 'expected@email'
        }
      };

      controller.generateWebToken(req, res);
    });
  });

});
