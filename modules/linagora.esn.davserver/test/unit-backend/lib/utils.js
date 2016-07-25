'use strict';

var q = require('q');
var chai = require('chai');
var expect = chai.expect;

describe('The davserver lib utils module', function() {

  var deps;
  var esnConfigMock, domainConfigMock;

  beforeEach(function() {
    esnConfigMock = {};
    domainConfigMock = {};

    deps = {
      'esn-config': function() {
        return esnConfigMock;
      },
      'domain-config': domainConfigMock
    };
  });

  function getModule() {
    return require('../../../backend/lib/utils')(dependencies);
  }

  function dependencies(name) {
    return deps[name];
  }

  describe('The getDavEndpoint fn', function() {

    it('should get DAV configuration from domain-config', function(done) {
      var domainId = 'domain123';
      var config = {
        backend: {
          url: 'http://localhost'
        }
      };

      domainConfigMock.get = function(id, configName) {
        expect(id).to.equal(domainId);
        expect(configName).to.equal('davserver');

        return q(config);
      };

      getModule().getDavEndpoint(domainId, function(url) {
        expect(url).to.equal(config.backend.url);
        done();
      });
    });

    it('should fallback to esn-config if domainId is not provided', function(done) {
      var config = {
        backend: {
          url: 'http://localhost'
        }
      };

      esnConfigMock.get = function(callback) {
        return callback(null, config);
      };

      getModule().getDavEndpoint(function(url) {
        expect(url).to.equal(config.backend.url);
        done();
      });
    });

    it('should callback to esn-config when domain-config rejects', function(done) {
      var domainId = 'domain123';
      var config = {
        backend: {
          url: 'http://localhost'
        }
      };

      esnConfigMock.get = function(callback) {
        return callback(null, config);
      };

      domainConfigMock.get = function() {
        return q.reject();
      };

      getModule().getDavEndpoint(domainId, function(url) {
        expect(url).to.equal(config.backend.url);
        done();
      });
    });

    it('should return DEFAULT_DAV_SERVER if both domain-config and esn-config failed', function(done) {
      var domainId = 'domain123';

      esnConfigMock.get = function(callback) {
        return callback(new Error());
      };

      domainConfigMock.get = function() {
        return q.reject();
      };

      getModule().getDavEndpoint(domainId, function(url) {
        expect(url).to.equal('http://localhost:80');
        done();
      });
    });

  });

});
