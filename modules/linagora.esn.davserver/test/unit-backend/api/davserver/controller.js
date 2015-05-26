'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The davserver controller', function() {

  describe('The getDavUrl function', function() {
    var module, getDavServerUrlForClient;

    beforeEach(function() {
      var davserver = function(dependencies) {
        return {
          getDavServerUrlForClient: getDavServerUrlForClient
        };
      };
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.davserver/backend';
      mockery.registerMock('./core', davserver);
    });

    it('should send back 500 if caldav.getDavServerUrlForClient() fail', function(done) {
      getDavServerUrlForClient = function(callback) {
        return callback(new Error());
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/controller')(this.moduleHelpers.dependencies);
      module.getDavUrl(null, res);
    });

    it('should send back 200 with the url', function(done) {
      var url = 'http://open-paas.org:80';
      getDavServerUrlForClient = function(callback) {
        return callback(null, url);
      };

      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.deep.equal({
            url: url
          });
          done();
        }
      };

      module = require(this.moduleHelpers.backendPath + '/webserver/api/davserver/controller')(this.moduleHelpers.dependencies);
      module.getDavUrl(null, res);
    });
  });
});
