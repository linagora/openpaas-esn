'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The template module', function() {

  describe('inject function', function() {

    it('should call user.store function if mongo is connected', function(done) {
      var userMock = { store: function() {
        done();
      } };
      var coreMock = {
        db: {
          mongo: {
            isConnected: function() {
              return true;
            }
          }
        },
        pubsub: {
          local: {
            publish: function() {
            },
            subscribe: function() {
            }
          }
        }
      };

      mockery.registerMock('./user', userMock);
      mockery.registerMock('..', coreMock);
      var templates = require(this.testEnv.basePath + '/backend/core').templates;
      templates.inject(function() {
      });
    });

    it('should register a callback if mongo is not connnected', function(done) {
      var subscriptions = {};
      var coreMock = {
        db: {
          mongo: {
            isConnected: function() {
              return false;
            }
          }
        },
        pubsub: {
          local: {
            topic: function(channel) {
              return {
                publish: function() {
                },
                subscribe: function(subscriber) {
                  subscriptions[channel] = subscriber;
                }
              };
            }
          }
        }
      };

      mockery.registerMock('..', coreMock);
      var templates = require(this.testEnv.basePath + '/backend/core').templates;
      templates.inject(function() {
        expect(subscriptions).to.have.property('mongodb:connectionAvailable');
        done();
      });
    });

    it('should register a callback that launch user.store if mongo is not connnected', function(done) {
      var subscriptions = {};
      var userMock = { store: function() {
        done();
      } };
      var coreMock = {
        db: {
          mongo: {
            isConnected: function() {
              return false;
            }
          }
        },
        pubsub: {
          local: {
            topic: function(channel) {
              return {
                publish: function() {
                },
                subscribe: function(subscriber) {
                  subscriptions[channel] = subscriber;
                },
                unsubscribe: function() {
                }
              };
            }
          }
        }
      };

      mockery.registerMock('./user', userMock);
      mockery.registerMock('..', coreMock);
      var templates = require(this.testEnv.basePath + '/backend/core').templates;
      templates.inject(function() {
        subscriptions['mongodb:connectionAvailable'](function() {
        });
      });
    });


  });
});
