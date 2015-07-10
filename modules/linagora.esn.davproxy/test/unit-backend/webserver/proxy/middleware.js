'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The proxy middleware', function() {

  var deps, dependencies;

  beforeEach(function() {
    dependencies = {
      auth: {
        token: {}
      },
      logger: {
        error: function() {
        }
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
  });

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

  describe('The getDavEndpoint function', function() {

    it('should send back a dav endpoint even on config error', function(done) {
      var req = {};
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            return callback(new Error());
          }
        };
      };
      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).getDavEndpoint;
      middleware(req, null, function() {
        expect(req.davserver).to.exist;
        done();
      });
    });

    it('should send back a dav endpoint even when config result is undefined', function(done) {
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            return callback();
          }
        };
      };

      var req = {};
      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).getDavEndpoint;
      middleware(req, null, function() {
        expect(req.davserver).to.exist;
        done();
      });
    });

    it('should send back the defined dav endpoint', function(done) {
      var endpoint = 'http://davserver:83838';
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            return callback(null, {backend: {url: endpoint}});
          }
        };
      };

      var req = {};
      var middleware = require('../../../../backend/webserver/proxy/middleware')(deps).getDavEndpoint;
      middleware(req, null, function() {
        expect(req.davserver).to.equal(endpoint);
        done();
      });
    });

  });
});
