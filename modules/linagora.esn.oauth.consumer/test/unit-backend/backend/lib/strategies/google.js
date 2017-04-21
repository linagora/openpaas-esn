'use strict';

const chai = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');
const expect = chai.expect;

describe('The Google strategy', function() {
  let deps, passportMocks, configMocks, helpersMock;
  const logger = {
    debug: function() {},
    info: function() {}
  };
  const dependencies = function(name) {
    return deps[name];
  };
  const STRATEGY_NAME = 'google-authz';

  beforeEach(function() {
    configMocks = {
      get: function(callback) {
        return callback(null, {
          google: {
            client_id: '0123456789',
            client_secret: 'abcdefgh'
          }
        });
      }
    };

    passportMocks = {
      use: function() {}
    };

    helpersMock = {
      upsertUserAccount: function(user, account, callback) {
        return callback();
      }
    };

    deps = {
      oauth: {
        helpers: helpersMock
      },
      logger: logger,
      'esn-config': function() {
        return configMocks;
      }
    };

    mockery.registerMock('passport', passportMocks);
  });

  describe('The configure function', function() {
    function getModule() {
      return require('../../../../../backend/lib/strategies/google')(dependencies);
    }

    it('should register google-authz passort if google is configured', function(done) {
      passportMocks.use = function(name) {
        expect(name).to.equal(STRATEGY_NAME);
      };

      getModule().configure(done);
    });

    it('should unregister google-authz and callback with error if google is not configured', function(done) {
      configMocks.get = function(callback) {
        return callback(null, {});
      };
      passportMocks.unuse = sinon.spy();

      getModule().configure(function(err) {
        expect(passportMocks.unuse).to.have.been.calledWith(STRATEGY_NAME);
        expect(err).to.deep.equal(new Error('Google OAuth is not configured'));

        done();
      });
    });
  });
});
