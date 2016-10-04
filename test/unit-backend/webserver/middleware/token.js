'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The token middleware', function() {

  describe('The generateNewToken function', function() {

    it('should send back HTTP 500 when getNewToken fails', function(done) {

      mockery.registerMock('../../core/auth/token', {
        getNewToken: function(options, callback) {
          return callback(new Error());
        }
      });

      var middleware = require('../../../../backend/webserver/middleware/token').generateNewToken();
      middleware(
        {query: {}, user: {_id: 123}},
        this.helpers.express.jsonResponse(function(code) {
          expect(code).to.equal(500);
          done();
        }),
        function() {
          done(new Error());
        });
    });

    it('should send back HTTP 500 when getNewToken sends back nothing', function(done) {
      mockery.registerMock('../../core/auth/token', {
        getNewToken: function(options, callback) {
          return callback();
        }
      });

      var middleware = require('../../../../backend/webserver/middleware/token').generateNewToken();
      middleware(
        {query: {}, user: {_id: 123}},
        this.helpers.express.jsonResponse(function(code) {
          expect(code).to.equal(500);
          done();
        }),
        function() {
          done(new Error());
        });
    });

    it('should generate the token with the input ttl', function(done) {
      var ttl = 1;
      var req = {user: {_id: 123}};
      mockery.registerMock('../../core/auth/token', {
        getNewToken: function(options) {
          expect(options.ttl).to.equal(ttl);
          return done();
        }
      });

      var middleware = require('../../../../backend/webserver/middleware/token').generateNewToken(ttl);
      middleware(req);
    });

    it('should set the token in request and call next', function(done) {
      var token = {token: 123, foo: 'bar'};
      mockery.registerMock('../../core/auth/token', {
        getNewToken: function(options, callback) {
          return callback(null, token);
        }
      });

      var req = {query: {}, user: {_id: 123}};
      var middleware = require('../../../../backend/webserver/middleware/token').generateNewToken();
      middleware(
        req,
        {
          json: function() {
            done(new Error());
          }
        },
        function() {
          expect(req.token).to.deep.equal(token);
          done();
        });
    });
  });

  describe('The getToken function', function() {
    function setupMocks(auth) {
      mockery.registerMock('../../core/auth/token', auth || {});
    }

    function checkResponse(status, json, done) {
      return function(_status) {
        expect(_status).to.equal(status);
        return {
          json: function(_json) {
            expect(_json).to.deep.equal(json);
            done();
          }
        };
      };
    }

    it('should return HTTP 400 if request does not contains token id', function(done) {
      setupMocks();

      var middleware = this.helpers.requireBackend('webserver/middleware/token');
      var req = {
        user: {
          _id: '123'
        },
        params: {}
      };
      var res = {
        status: checkResponse(400, {
          error: {
            code: 400,
            message: 'Bad request',
            details: 'Can not retrieve token'
          }
        }, done)
      };
      middleware.getToken(req, res);
    });

    it('should return HTTP 500 if auth.getToken sends back error', function(done) {

      var auth = {
        getToken: function(options, callback) {
          return callback(new Error());
        }
      };
      setupMocks(auth);

      var middleware = this.helpers.requireBackend('webserver/middleware/token');
      var req = {
        user: {
          _id: '123'
        },
        params: {
          token: 456
        }
      };
      var res = {
        status: checkResponse(500, {error: {code: 500, message: 'Server Error', details: 'Can not get token'}}, done)
      };
      middleware.getToken(req, res);
    });

    it('should return HTTP 404 if auth.getToken does not send back token', function(done) {

      var auth = {
        getToken: function(options, callback) {
          return callback();
        }
      };

      setupMocks(auth);

      var middleware = this.helpers.requireBackend('webserver/middleware/token');
      var req = {
        user: {
          _id: '123'
        },
        params: {
          token: 456
        }
      };
      var res = {
        status: checkResponse(404, {
          error: {
            code: 404,
            message: 'Not found',
            details: 'Token not found or expired'
          }
        }, done)
      };
      middleware.getToken(req, res);
    });

    it('should set the token in request and call next', function(done) {

      var token = {_id: 123, user: 456};

      var auth = {
        getToken: function(options, callback) {
          return callback(null, token);
        }
      };

      setupMocks(auth);

      var middleware = this.helpers.requireBackend('webserver/middleware/token');
      var req = {
        user: {
          _id: '123'
        },
        params: {
          token: 456
        }
      };
      var res = {
        status: function() {
          done(new Error('Should not be called'));
        }
      };
      middleware.getToken(req, res, function() {
        expect(req.token).to.deep.equal(token);
        done();
      });
    });
  });
});
