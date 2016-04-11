'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The Facebook strategy', function() {
  var deps, passportMocks, configMocks;
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
          facebook: {
            client_id: '0123456789',
            client_secret: 'abcdefgh'
          }
        });
      }
    };

    passportMocks = {
      use: function() {}
    };

    deps = {
      logger: logger,
      'esn-config': function() {
        return configMocks;
      }
    };

    mockery.registerMock('passport', passportMocks);
  });

  describe('The configure function', function() {
    function getModule() {
      return require('../../../../../backend/lib/strategies/facebook')(dependencies);
    }

    it('should register facebook-authz passort if facebook is configured', function(done) {
      passportMocks.use = function(name) {
        expect(name).to.equal('facebook-authz');
      };

      getModule().configure(done);
    });

    it('should callback with error if facebook is not configured', function(done) {
      configMocks.get = function(callback) {
        return callback(null, {});
      };

      getModule().configure(function(err) {
        expect(err).to.deep.equal(new Error('Facebook OAuth is not configured'));
        done();
      });
    });
  });
});

