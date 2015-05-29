'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The dav core module', function() {
  var module, get;

  beforeEach(function() {
    var esnConfigMock = function(key) {
      return {
        get: get
      };
    };
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.davserver/backend';
    this.moduleHelpers.addDep('esn-config', esnConfigMock);
    var clientMock = function() {};
    mockery.registerMock('../../../lib/caldav', clientMock);
  });

  describe('The getDavServerUrlForServer fn', function() {

    it('should return an error if esnconfig fail', function(done) {
      get = function(callback) {
        callback(new Error('Error'), null);
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/core')(this.moduleHelpers.dependencies);
      module.getDavServerUrlForServer(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return "http://localhost:80" if the configuration is not in the database', function(done) {
      get = function(callback) {
        callback(null, null);
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/core')(this.moduleHelpers.dependencies);
      module.getDavServerUrlForServer(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://localhost:80');
        done();
      });
    });

    it('should return the configuration', function(done) {
      get = function(callback) {
        callback(null, {
          backend: {
            url: 'http://open-paas.org'
          }
        });
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/core')(this.moduleHelpers.dependencies);
      module.getDavServerUrlForServer(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://open-paas.org');
        done();
      });
    });
  });

  describe('The getDavServerUrlForClient fn', function() {

    it('should return an error if esnconfig fail', function(done) {
      get = function(callback) {
        callback(new Error('Error'), null);
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/core')(this.moduleHelpers.dependencies);
      module.getDavServerUrlForClient(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return "http://localhost:80" if the configuration is not in the database', function(done) {
      get = function(callback) {
        callback(null, {});
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/core')(this.moduleHelpers.dependencies);
      module.getDavServerUrlForClient(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://localhost:80');
        done();
      });
    });

    it('should return the configuration', function(done) {
      get = function(callback) {
        callback(null, {
          frontend: {
            url: 'http://open-paas.org'
          }
        });
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/core')(this.moduleHelpers.dependencies);
      module.getDavServerUrlForClient(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://open-paas.org');
        done();
      });
    });
  });
});
