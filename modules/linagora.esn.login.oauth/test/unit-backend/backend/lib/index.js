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
  let pubsubMock, esnConfigMock;

  beforeEach(function() {
    configMock = {};
    pubsubMock = {
      global: {
        topic() {
          return {
            subscribe() {}
          };
        }
      }
    };
    esnConfigMock = {
      constants: {
        EVENTS: {
          CONFIG_UPDATED: 'esn-config:config:updated'
        }
      }
    };
    deps = {
      logger: logger,
      config: config,
      pubsub: pubsubMock,
      'esn-config': esnConfigMock
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

    it('should listen on pubsub event to reconfigure when OAuth config updated', function(done) {
      const configureSpy = sinon.spy(callback => callback());
      let subscriber;

      configMock = {
        auth: {
          oauth: {
            strategies: ['facebook']
          }
        }
      };
      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: configureSpy
        };
      });

      pubsubMock.global.topic = topic => {
        expect(topic).to.equal(esnConfigMock.constants.EVENTS.CONFIG_UPDATED);

        return {
          subscribe(callback) {
            subscriber = callback;
          }
        };
      };

      getModule().start(() => {
        expect(configureSpy).to.have.been.calledOnce;

        subscriber({
          moduleName: 'core',
          configsUpdated: [{ name: 'oauth' }]
        });

        expect(configureSpy).to.have.been.calledTwice;

        done();
      });
    });

    it('should not reconfigure when OAuth is not updated', function(done) {
      const configureSpy = sinon.spy(callback => callback());
      let subscriber;

      configMock = {
        auth: {
          oauth: {
            strategies: ['facebook']
          }
        }
      };
      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: configureSpy
        };
      });

      pubsubMock.global.topic = topic => {
        expect(topic).to.equal(esnConfigMock.constants.EVENTS.CONFIG_UPDATED);

        return {
          subscribe(callback) {
            subscriber = callback;
          }
        };
      };

      getModule().start(() => {
        expect(configureSpy).to.have.been.calledOnce;

        subscriber({
          moduleName: 'core',
          configsUpdated: [{ name: 'not_oauth' }]
        });

        expect(configureSpy).to.have.been.calledOnce;

        done();
      });
    });

  });
});
