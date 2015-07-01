'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The proxy middleware', function() {

  var dependencies = {
    auth: {
      token: {
      }
    },
    logger: {
      error: function() {}
    }
  };
  var deps = function(name) {
    return dependencies[name];
  };

  describe('The generateNewToken function', function() {

    it('should send back HTTP 500 when getNewToken fails', function(done) {
      dependencies.auth.token.getNewToken = function(options, callback) {
        return callback(new Error());
      };

      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).generateNewToken;
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
      dependencies.auth.token.getNewToken = function(options, callback) {
        return callback();
      };

      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).generateNewToken;
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

    it('should generate the token with the graceperiod', function(done) {
      var req = {query: {graceperiod: 2}, user: {_id: 123}};
      dependencies.auth.token.getNewToken = function(options) {
        expect(options.ttl >= req.query.graceperiod).to.be.true;
        return done();
      };

      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).generateNewToken;
      middleware(req);
    });

    it('should set the token in request and call next', function(done) {
      var token = {token: 123, foo: 'bar'};
      dependencies.auth.token.getNewToken = function(options, callback) {
        return callback(null, token);
      };

      var req = {query: {}, user: {_id: 123}};
      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).generateNewToken;
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
