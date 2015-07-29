'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The davserver middleware', function() {

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
      var middleware = require('../../../backend/webserver/api/middleware')(deps).getDavEndpoint;
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
      var middleware = require('../../../backend/webserver/api/middleware')(deps).getDavEndpoint;
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
      var middleware = require('../../../backend/webserver/api/middleware')(deps).getDavEndpoint;
      middleware(req, null, function() {
        expect(req.davserver).to.equal(endpoint);
        done();
      });
    });

  });
});
