'use strict';

var expect = require('chai').expect;

describe('The caldav core module', function() {

  describe('The getCaldavServerUrlForServer fn', function() {

    it('should return an error if esnconfig fail', function(done) {
      var get = function(callback) {
        callback(new Error('Error'), null);
      };
      this.helpers.mock.esnConfig(get);

      var module = require(this.testEnv.basePath + '/backend/core/caldav');
      module.getCaldavServerUrlForServer(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return "http://localhost:80" if the configuration is not in the database', function(done) {
      var get = function(callback) {
        callback(null, null);
      };
      this.helpers.mock.esnConfig(get);

      var module = require(this.testEnv.basePath + '/backend/core/caldav');
      module.getCaldavServerUrlForServer(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://localhost:80');
        done();
      });
    });

    it('should return the configuration', function(done) {
      var get = function(callback) {
        callback(null, {
          backend: {
            url: 'http://open-paas.org'
          }
        });
      };
      this.helpers.mock.esnConfig(get);

      var module = require(this.testEnv.basePath + '/backend/core/caldav');
      module.getCaldavServerUrlForServer(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://open-paas.org');
        done();
      });
    });
  });

  describe('The getCaldavServerUrlForClient fn', function() {

    it('should return an error if esnconfig fail', function(done) {
      var get = function(callback) {
        callback(new Error('Error'), null);
      };
      this.helpers.mock.esnConfig(get);

      var module = require(this.testEnv.basePath + '/backend/core/caldav');
      module.getCaldavServerUrlForClient(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return "http://localhost:80" if the configuration is not in the database', function(done) {
      var get = function(callback) {
        callback(null, {});
      };
      this.helpers.mock.esnConfig(get);

      var module = require(this.testEnv.basePath + '/backend/core/caldav');
      module.getCaldavServerUrlForClient(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://localhost:80');
        done();
      });
    });

    it('should return the configuration', function(done) {
      var get = function(callback) {
        callback(null, {
          frontend: {
            url: 'http://open-paas.org'
          }
        });
      };
      this.helpers.mock.esnConfig(get);

      var module = require(this.testEnv.basePath + '/backend/core/caldav');
      module.getCaldavServerUrlForClient(function(err, url) {
        expect(err).to.not.exist;
        expect(url).to.equal('http://open-paas.org');
        done();
      });
    });
  });
});
