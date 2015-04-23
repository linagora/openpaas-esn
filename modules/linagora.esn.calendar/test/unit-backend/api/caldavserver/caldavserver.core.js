'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The caldav core module', function() {
  var module, get;

  beforeEach(function() {
    var esnConfigMock = function(key) {
      return {
        get: get
      };
    };
    this.moduleHelpers.addDep('esn-config', esnConfigMock);
    var clientMock = function() {};
    mockery.registerMock('../../../lib/caldav', clientMock);
  });

  describe('The getCaldavServerUrlForServer fn', function() {

    it('should return an error if esnconfig fail', function(done) {
      get = function(callback) {
        callback(new Error('Error'), null);
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.core')(this.moduleHelpers.dependencies);
      module.getCaldavServerUrlForServer(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return "http://localhost:80" if the configuration is not in the database', function(done) {
      get = function(callback) {
        callback(null, null);
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.core')(this.moduleHelpers.dependencies);
      module.getCaldavServerUrlForServer(function(err, url) {
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
      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.core')(this.moduleHelpers.dependencies);
      module.getCaldavServerUrlForServer(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://open-paas.org');
        done();
      });
    });
  });

  describe('The getCaldavServerUrlForClient fn', function() {

    it('should return an error if esnconfig fail', function(done) {
      get = function(callback) {
        callback(new Error('Error'), null);
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.core')(this.moduleHelpers.dependencies);
      module.getCaldavServerUrlForClient(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return "http://localhost:80" if the configuration is not in the database', function(done) {
      get = function(callback) {
        callback(null, {});
      };
      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.core')(this.moduleHelpers.dependencies);
      module.getCaldavServerUrlForClient(function(err, url) {
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
      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.core')(this.moduleHelpers.dependencies);
      module.getCaldavServerUrlForClient(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://open-paas.org');
        done();
      });
    });
  });
});
