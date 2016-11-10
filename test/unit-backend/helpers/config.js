'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The config helper', function() {

  describe('The getBaseUrl fn', function() {

    it('should fail if esnConfig search fails', function(done) {
      var esnConfigMock = function(key) {
        expect(key).to.equal('web');

        return {
          forUser: function() {
            return {
              get: function(callback) {
                return callback(new Error());
              }
            };
          }
        };
      };

      mockery.registerMock('../core/esn-config', esnConfigMock);
      var module = this.helpers.requireBackend('helpers/config');

      module.getBaseUrl(null, function(err, baseUrl) {
        expect(err).to.exist;
        expect(baseUrl).to.not.exist;
        done();
      });
    });

    it('should return base_url for web key', function(done) {
      var user = {
        _id: '123',
        firstname: 'foo',
        lastname: 'bar'
      };
      var expectedWeb = {
        base_url: 'http://localhost:8081'
      };
      var esnConfigMock = function(key) {
        expect(key).to.equal('web');

        return {
          forUser: function() {
            return {
              get: function(callback) {
                return callback(null, expectedWeb.base_url);
              }
            };
          }
        };
      };

      mockery.registerMock('../core/esn-config', esnConfigMock);
      var module = this.helpers.requireBackend('helpers/config');

      module.getBaseUrl(user, function(err, baseUrl) {
        expect(err).to.not.exist;
        expect(baseUrl).to.equal(expectedWeb.base_url);
        done();
      });
    });
  });
});
