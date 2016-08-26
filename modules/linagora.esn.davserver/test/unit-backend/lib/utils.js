'use strict';

var q = require('q');
var chai = require('chai');
var expect = chai.expect;

describe('The davserver lib utils module', function() {

  var deps;
  var esnConfigMock;
  var DEFAULT_DAV_SERVER = 'http://localhost:80';

  beforeEach(function() {
    esnConfigMock = {};

    deps = {
      'esn-config': function() {
        return esnConfigMock;
      },
      logger: {
        error: function() {}
      }
    };
  });

  function getModule() {
    return require('../../../backend/lib/utils')(dependencies);
  }

  function dependencies(name) {
    return deps[name];
  }

  describe('The getDavEndpoint fn', function() {

    it('should get DAV configuration from specified user', function(done) {
      var user = { _id: '111' };
      var config = {
        backend: {
          url: 'http://localhost'
        }
      };

      esnConfigMock.forUser = function(_user) {
        expect(_user).to.deep.equal(user);

        return {
          get: function() {
            return q(config);
          }
        };
      };

      getModule().getDavEndpoint(user, function(url) {
        expect(url).to.equal(config.backend.url);
        done();
      });
    });

    it('should return DEFAULT_DAV_SERVER if DAV configuration is not available', function(done) {
      var user = { _id: '111' };

      esnConfigMock.forUser = function(_user) {
        expect(_user).to.deep.equal(user);

        return {
          get: function() {
            return q(null);
          }
        };
      };

      getModule().getDavEndpoint(user, function(url) {
        expect(url).to.equal(DEFAULT_DAV_SERVER);
        done();
      });
    });

    it('should return DEFAULT_DAV_SERVER if it failed to get DAV configuration', function(done) {
      var user = { _id: '111' };

      esnConfigMock.forUser = function(_user) {
        expect(_user).to.deep.equal(user);

        return {
          get: function() {
            return q.reject(new Error());
          }
        };
      };

      getModule().getDavEndpoint(user, function(url) {
        expect(url).to.equal(DEFAULT_DAV_SERVER);
        done();
      });
    });

  });

});
