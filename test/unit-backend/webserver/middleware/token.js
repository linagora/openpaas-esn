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
        {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        },
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
        {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        },
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
});
