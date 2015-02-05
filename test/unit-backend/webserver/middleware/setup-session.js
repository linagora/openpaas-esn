'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('the setup-session middleware', function() {
  it('should be a function', function() {
    var setupSession = this.helpers.requireBackend('webserver/middleware/setup-sessions');
    expect(setupSession).to.be.a.function;
  });

  it('should set the middleware if the datastore is connected', function(done) {
    var mongooseMock = this.helpers.requireFixture('mongoose').mongoose();
    mongooseMock.connections = [true];

    var coreMock = {
      db: {
        mongo: {
          isConnected: function() { return true; }
        }
      },
      logger: { debug: function() {} },
      pubsub: {
        local: {
          topic: function() { return { subscribe: function() {}, publish: function() {} }; }
        }
      }
    };

    var connectMongoMock = function() { return function() { this.on = function() {}; }; };

    var session = {
      setMiddleware: function() {
        done();
      }
    };

    mockery.registerMock('mongoose', mongooseMock);
    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('connect-mongo', connectMongoMock);

    var setupSession = this.helpers.requireBackend('webserver/middleware/setup-sessions');
    setupSession(session);

  });

  it('should register a subscription mongodb:connectionAvailable', function() {
    var mongooseMock = this.helpers.requireFixture('mongoose').mongoose();
    mongooseMock.connections = [true];

    var subscriptions = {};

    var coreMock = {
      db: {
        mongo: {
          isConnected: function() { return false; }
        }
      },
      logger: { debug: function() {} },
      pubsub: {
        local: {
          topic: function(topic) { return { subscribe: function(handler) { subscriptions[topic] = handler; } }; }
        }
      }
    };

    var connectMongoMock = function() { return function() { this.on = function() {}; }; };

    var session = {
      setMiddleware: function() {
      }
    };

    mockery.registerMock('mongoose', mongooseMock);
    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('connect-mongo', connectMongoMock);

    var setupSession = this.helpers.requireBackend('webserver/middleware/setup-sessions');
    setupSession(session);
    expect(subscriptions).to.have.property('mongodb:connectionAvailable');
    expect(subscriptions['mongodb:connectionAvailable']).to.be.a.function;
  });

  it('should set the session middleware when mongodb:connectionAvailable is published', function(done) {
    var mongooseMock = this.helpers.requireFixture('mongoose').mongoose();
    mongooseMock.connections = [true];

    var subscriptions = {};

    var coreMock = {
      db: {
        mongo: {
          isConnected: function() { return false; }
        }
      },
      logger: { debug: function() {} },
      pubsub: {
        local: {
          topic: function(topic) { return {
            subscribe: function(handler) { subscriptions[topic] = handler; },
            publish: function() {}
          }; }
        }
      }
    };

    var connectMongoMock = function() { return function() { this.on = function() {}; }; };

    var session = {
      setMiddleware: function() {
      }
    };

    mockery.registerMock('mongoose', mongooseMock);
    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('connect-mongo', connectMongoMock);

    var setupSession = this.helpers.requireBackend('webserver/middleware/setup-sessions');
    setupSession(session);
    session.setMiddleware = function() {done();};
    subscriptions['mongodb:connectionAvailable']();

  });

});
