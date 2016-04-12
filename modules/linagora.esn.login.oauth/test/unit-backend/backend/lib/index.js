'use strict';

var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var expect = chai.expect;

describe('The login oauth backend module', function() {
  var deps;
  var configMock;
  var logger = {
    debug: function() {},
    info: function() {},
    warn: function() {}
  };
  var config = function() {
    return configMock;
  };
  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    configMock = {};
    deps = {
      logger: logger,
      config: config
    };
  });

  describe('The start function', function() {
    function getModule() {
      return require('../../../../backend/lib/index')(dependencies);
    }

    it('should start without any strategy', function(done) {
      getModule().start(done);
    });

    it('should configure all defined strategies', function(done) {
      configMock = {
        auth: {
          oauth: {
            strategies: ['facebook']
          }
        }
      };
      var facebookSpy = sinon.spy();
      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: function(callback) {
            facebookSpy();
            callback();
          }
        };
      });

      getModule().start(function(err) {
        expect(err).to.not.exist;
        expect(facebookSpy).to.have.been.calledOnce;
        done();
      });
    });

    it('should not fail when a strategy configure call fails', function(done) {
      configMock = {
        auth: {
          oauth: {
            strategies: ['facebook']
          }
        }
      };

      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: function(callback) {
            callback(new Error('I failed'));
          }
        };
      });
      getModule().start(done);
    });

    it('should not fail when a strategy does not exist', function(done) {
      configMock = {
        auth: {
          oauth: {
            strategies: ['facebook', 'foobar']
          }
        }
      };
      var facebookSpy = sinon.spy();
      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: function(callback) {
            facebookSpy();
            callback();
          }
        };
      });
      getModule().start(function(err) {
        expect(err).to.not.exist;
        expect(facebookSpy).to.have.been.calledOnce;
        done();
      });
    });
  });
});
