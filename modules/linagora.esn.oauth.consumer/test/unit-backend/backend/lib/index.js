'use strict';

const chai = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');
const expect = chai.expect;

describe('The OAuth Consumer backend module', function() {
  let esnConfigMock;
  let getModule;

  beforeEach(function() {
    getModule = () => require('../../../../backend/lib/index')(this.moduleHelpers.dependencies);

    esnConfigMock = {
      onChange() {}
    };

    this.moduleHelpers.addDep('esn-config', () => esnConfigMock);
  });

  describe('The start function', function() {
    it('should configure all the strategies', function(done) {
      const twitterSpy = sinon.spy();
      const googleSpy = sinon.spy();

      mockery.registerMock('./strategies', function() {
        return {
          twitter: {
            configure: function(callback) {
              twitterSpy();
              callback();
            }
          },
          google: {
            configure: function(callback) {
              googleSpy();
              callback();
            }
          }
        };
      });

      getModule().start(function(err) {
        expect(err).to.not.exist;
        expect(twitterSpy).to.have.been.calledOnce;
        expect(googleSpy).to.have.been.calledOnce;
        done();
      });
    });

    it('should not fail when a strategy configure call fails', function(done) {
      mockery.registerMock('./strategies', function() {
        return {
          twitter: {
            configure: function(callback) {
              callback(new Error('I failed'));
            }
          },
          google: {
            configure: function(callback) {
              callback();
            }
          }
        };
      });
      getModule().start(done);
    });

    it('should not fail when all strategies configure calls fail', function(done) {
      mockery.registerMock('./strategies', function() {
        return {
          twitter: {
            configure: function(callback) {
              callback(new Error('I failed'));
            }
          },
          google: {
            configure: function(callback) {
              callback(new Error('I failed'));
            }
          }
        };
      });
      getModule().start(done);
    });

    it('should listen on OAuth config change to reconfigure the strategies', function(done) {
      const configureSpy = sinon.spy(callback => callback());
      let subscriber;

      mockery.registerMock('./strategies', function() {
        return {
          twitter: {
            configure: configureSpy
          },
          google: {
            configure: configureSpy
          }
        };
      });

      esnConfigMock.onChange = callback => (subscriber = callback);

      getModule().start(() => {
        expect(configureSpy).to.have.been.calledTwice;

        subscriber();

        expect(configureSpy).to.have.been.callCount(4);

        done();
      });
    });
  });
});
