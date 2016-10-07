'use strict';

const mockery = require('mockery');
const expect = require('chai').expect;
const q = require('q');

describe('The google token oauth login strategy', function() {
  let dependencies;
  let requireBackend;

  beforeEach(function() {
    requireBackend = this.helpers.requireBackend;
    dependencies = this.moduleHelpers.dependencies;
    this.testEnv.basePath = './../modules/linagora.esn.login.oauth';
  });

  describe('The configure function', function() {
    function getModule() {
      return requireBackend('lib/strategies/google-token')(dependencies);
    }

    it('should callback with error when getOAuthConfiguration fails', function(done) {
      const msg = 'I failed';

      mockery.registerMock('./commons', function() {
        return {
          getOAuthConfiguration() {
            return q.reject(new Error(msg));
          }
        };
      });

      mockery.registerMock('passport', {
        use: function() {
          done(new Error('Should not be called'));
        }
      });

      getModule().configure(function(err) {
        expect(err.message).to.equal(msg);
        done();
      });
    });

    it('should register google-token-login passport if google token is configured', function(done) {
      mockery.registerMock('./commons', function() {
        return {
          getOAuthConfiguration() {
            return q({});
          },
          handleResponse() {}
        };
      });

      mockery.registerMock('passport-google-token', {
        Strategy: function() {}
      });

      mockery.registerMock('passport', {
        use: function(name) {
          expect(name).to.equal('google-token-login');
        }
      });

      getModule().configure(done);
    });
  });
});
