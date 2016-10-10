'use strict';

const mockery = require('mockery');
const expect = require('chai').expect;
const q = require('q');

describe('The google helpers', function() {
  let dependencies;
  let requireBackend;

  beforeEach(function() {
    requireBackend = this.helpers.requireBackend;
    dependencies = this.moduleHelpers.dependencies;
    this.testEnv.basePath = './../modules/linagora.esn.login.oauth';
  });

  describe('The getAccessToken function', function() {
    function getModule() {
      return requireBackend('lib/helpers/google')(dependencies);
    }

    it('should send back an error when getOAuthConfiguration fails', function(done) {
      const msg = 'getOAuthConfiguration failed';
      const success = function() {};
      const error = function(error) {
        expect(error.message).to.equal('OAuth is not configured correctly');
        done();
      };

      mockery.registerMock('./../strategies/commons', function() {
        return {
          getOAuthConfiguration() {
            return q.reject(new Error(msg));
          }
        };
      });

      getModule().getAccessToken().then(success, error);
    });

    it('should send back error when request respond error', function(done) {
      const serverAuthCode = 123456;
      const success = function() {};
      const error = function(error) {
        expect(error.message).to.equal('Can not get Google access token');
        done();
      };

      mockery.registerMock('request', function(options, callback) {
        return callback({}, {statusCode: 500}, '{"error":"request"}');
      });

      mockery.registerMock('./../strategies/commons', function() {
        return {
          getOAuthConfiguration() {
            return q({
              client_id: 123,
              client_secret: 456
            });
          }
        };
      });

      getModule().getAccessToken(serverAuthCode).then(success, error);
    });
  });
});
