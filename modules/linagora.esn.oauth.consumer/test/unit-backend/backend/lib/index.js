'use strict';

var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var expect = chai.expect;

describe('The OAuth Consumer backend module', function() {
  var deps;
  var logger = {
    debug: function() {},
    info: function() {},
    warn: function() {}
  };
  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    deps = {
      logger: logger
    };
  });

  describe('The start function', function() {
    function getModule() {
      return require('../../../../backend/lib/index')(dependencies);
    }

    it('should configure all the strategies', function(done) {
      var twitterSpy = sinon.spy();
      var googleSpy = sinon.spy();
      mockery.registerMock('./strategies', function() {
        return {
          twitter: {
            configure: function (callback) {
              twitterSpy();
              callback();
            }
          },
          google: {
            configure: function (callback) {
              googleSpy();
              callback();
            }
          }
        }
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
            configure: function (callback) {
              callback(new Error('I failed'));
            }
          },
          google: {
            configure: function (callback) {
              callback();
            }
          }
        }
      });
      getModule().start(done);
    });

    it('should not fail when all strategies configure calls fail', function(done) {
      mockery.registerMock('./strategies', function() {
        return {
          twitter: {
            configure: function (callback) {
              callback(new Error('I failed'));
            }
          },
          google: {
            configure: function (callback) {
              callback(new Error('I failed'));
            }
          }
        }
      });
      getModule().start(done);
    });
  });
});
