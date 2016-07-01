'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The Twitter strategy', function() {
  var deps, passportMocks, configMocks, helpersMock;
  var logger = {
    debug: function() {},
    info: function() {}
  };
  var dependencies = function(name) {
    return deps[name];
  };

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
        expect(name).to.equal('twitter-authz');
      };

      getModule().configure(done);
    });

    it('should callback with error if twitter is not configured', function(done) {
      configMocks.get = function(callback) {
        return callback(null, {
          twitter: {}
        });
      };

      getModule().configure(function(err) {
        expect(err).to.deep.equal(new Error('Twitter OAuth is not configured'));
        done();
      });
    });
  });
});
