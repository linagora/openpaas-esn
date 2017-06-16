'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var q = require('q');

describe('The twitter oauth login strategy', function() {
  var deps;
  var logger = {
    debug: function() {},
    err: function() {},
    info: function() {}
  };
  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    deps = {
      logger: logger
    };
  });

  describe('The configure function', function() {
    function getModule() {
      return require('../../../../../backend/lib/strategies/twitter')(dependencies);
    }

    it('should callback with error when getTwitterConfiguration fails', function(done) {
      var msg = 'I failed';

      mockery.registerMock('./commons', function() {
        return {
          getCallbackEndpoint: function() {
            return q();
          }
        };
      });

      deps['esn-config'] = function() {
        return {
          get: function(callback) {
            return callback(new Error(msg));
          }
        };
      };

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

    it('should register twitter-login passport if twitter is configured', function(done) {
      mockery.registerMock('./commons', function() {
        return {
          getCallbackEndpoint: function() {
            return 'oauth_callback_url';
          },
          handleResponse: function() {}
        };
      });

      deps['esn-config'] = function() {
        return {
          get: function(callback) {
            return callback(null, {
              twitter: {
                consumer_key: 1,
                consumer_secret: 2
              }
            });
          }
        };
      };

      mockery.registerMock('passport-twitter', {
        Strategy: function() {}
      });

      mockery.registerMock('passport', {
        use: function(name) {
          expect(name).to.equal('twitter-login');
        }
      });

      getModule().configure(done);
    });
  });
});
