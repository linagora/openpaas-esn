'use strict';

const chai = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');
const expect = chai.expect;

describe('The login oauth backend module', function() {
  let getModule;
  let configMock, esnConfigMock;

  beforeEach(function() {
    getModule = () => require('../../../../backend/lib/index')(this.moduleHelpers.dependencies);

    configMock = {};
    esnConfigMock = {
      onChange() {}
    };
    this.moduleHelpers.addDep('config', () => configMock);
    this.moduleHelpers.addDep('esn-config', () => esnConfigMock);
  });

  describe('The start function', function() {
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
      const facebookSpy = sinon.spy();

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
      const facebookSpy = sinon.spy();

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
      esnConfigMock.onChange = callback => (subscriber = callback);
      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: configureSpy
        };
      });

      getModule().start(() => {
        expect(configureSpy).to.have.been.calledOnce;

        subscriber();

        expect(configureSpy).to.have.been.calledTwice;

        done();
      });
    });

    it('should unregister strategies when OAuth is not configured correctly', function(done) {
      configMock = {
        auth: {
          oauth: {
            strategies: ['facebook']
          }
        }
      };
      const STRATEGY_NAME = 'facebook-login';
      const passportMock = {
        unuse: sinon.spy()
      };

      mockery.registerMock('passport', passportMock);
      mockery.registerMock('./strategies/facebook', function() {
        return {
          configure: function(callback) {
            callback(new Error('facebook OAuth is not configured correctly'));
          },
          name: STRATEGY_NAME
        };
      });

      getModule().start(function(err) {
        expect(err).to.not.exist;
        expect(passportMock.unuse).to.have.been.calledWith(STRATEGY_NAME);
        done();
      });
    });

  });
});
