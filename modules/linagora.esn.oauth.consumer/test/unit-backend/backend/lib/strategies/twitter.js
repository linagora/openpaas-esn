'use strict';

const chai = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');
const expect = chai.expect;

describe('The Twitter strategy', function() {
  let deps, passportMocks, configMocks, helpersMock;
  const logger = {
    debug: function() {},
    info: function() {}
  };
  const dependencies = function(name) {
    return deps[name];
  };
  const STRATEGY_NAME = 'twitter-authz';

  beforeEach(function() {
    configMocks = {
      get: function(callback) {
        return callback(null, {
          twitter: {
            consumer_key: '0123456789',
            consumer_secret: 'abcdefgh'
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
      return require('../../../../../backend/lib/strategies/twitter')(dependencies);
    }

    it('should register twitter-authz passort if twitter is configured', function(done) {
      passportMocks.use = function(name) {
        expect(name).to.equal(STRATEGY_NAME);
      };

      getModule().configure(done);
    });

    it('should unregister twitter-authz and callback with error if twitter is not configured', function(done) {
      configMocks.get = function(callback) {
        return callback(null, {
          twitter: {}
        });
      };
      passportMocks.unuse = sinon.spy();

      getModule().configure(function(err) {
        expect(passportMocks.unuse).to.have.been.calledWith(STRATEGY_NAME);
        expect(err).to.deep.equal(new Error('Twitter OAuth is not configured'));

        done();
      });
    });
  });
});
