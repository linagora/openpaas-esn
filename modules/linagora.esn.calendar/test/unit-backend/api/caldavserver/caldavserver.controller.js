'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The caldavserver controller', function() {

  describe('The getCaldavUrl function', function() {
    var module, getCaldavServerUrlForClient;

    beforeEach(function() {
      var caldavserver = function(dependencies) {
        return {
          getCaldavServerUrlForClient: getCaldavServerUrlForClient
        };
      };
      mockery.registerMock('./caldavserver.core', caldavserver);
    });

    it('should send back 500 if caldav.getCaldavServerUrlForClient() fail', function(done) {
      getCaldavServerUrlForClient = function(callback) {
        return callback(new Error());
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.controller')(this.moduleHelpers.dependencies);
      module.getCaldavUrl(null, res);
    });

    it('should send back 200 with the url', function(done) {
      var url = 'http://open-paas.org:80';
      getCaldavServerUrlForClient = function(callback) {
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

      module = require(this.moduleHelpers.backendPath + '/webserver/api/caldavserver/caldavserver.controller')(this.moduleHelpers.dependencies);
      module.getCaldavUrl(null, res);
    });
  });
});
