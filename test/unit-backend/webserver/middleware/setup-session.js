'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const q = require('q');

describe('The setup-session middleware', function() {
  let MongoStore;

  beforeEach(function() {
    const mongooseMock = this.helpers.requireFixture('mongoose').mongoose();

    MongoStore = sinon.spy();
    mockery.registerMock('connect-mongo', () => MongoStore);
    mockery.registerMock('mongoose', mongooseMock);
  });

  it('should be a function', function() {
    const setupSession = this.helpers.requireBackend('webserver/middleware/setup-sessions');

    expect(setupSession).to.be.a.function;
  });

  it('should set the middleware if the datastore is connected', function(done) {
    const coreMock = {
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
      },
      'esn-config': () => ({
        get: sinon.stub().returns(Promise.resolve({}))
      })
    };

    const session = {
      setMiddleware: function() {
        done();
      }
    };

    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('express-session', sinon.spy());

    this.helpers.requireBackend('webserver/middleware/setup-sessions')(session);
  });

  it('should register a subscription mongodb:connectionAvailable', function() {
    const subscriptions = {};
    const coreMock = {
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

    const session = {
      setMiddleware: function() {
      }
    };

    mockery.registerMock('../../core', coreMock);

    this.helpers.requireBackend('webserver/middleware/setup-sessions')(session);

    expect(subscriptions).to.have.property('mongodb:connectionAvailable');
    expect(subscriptions['mongodb:connectionAvailable']).to.be.a.function;
  });

  it('should set the session middleware when mongodb:connectionAvailable is published', function(done) {
    const subscriptions = {};
    const coreMock = {
      db: {
        mongo: {
          isConnected: function() { return false; }
        }
      },
      logger: { debug: function() {} },
      pubsub: {
        local: {
          topic: function(topic) {
            return {
              subscribe: function(handler) { subscriptions[topic] = handler; },
              publish: function() {}
            };
          }
        }
      },
      'esn-config': () => ({
        get: () => q.resolve()
      })
    };

    const session = {
      setMiddleware: function() {
      }
    };

    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('express-session', sinon.spy());

    this.helpers.requireBackend('webserver/middleware/setup-sessions')(session);

    session.setMiddleware = function() { done(); };
    subscriptions['mongodb:connectionAvailable']();
  });

  it('should use the cached MongoStore to set up session middleware when mongodb:connectionAvailable is published twice', function() {
    const subscriptions = {};
    const coreMock = {
      db: {
        mongo: {
          isConnected: function() { return false; }
        }
      },
      logger: { debug: function() {} },
      pubsub: {
        local: {
          topic: function(topic) {
            return {
              subscribe: function(handler) { subscriptions[topic] = handler; },
              publish: function() {}
            };
          }
        }
      },
      'esn-config': () => ({
        get: () => q.resolve()
      })
    };
    const session = { setMiddleware() {} };

    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('express-session', sinon.spy());

    this.helpers.requireBackend('webserver/middleware/setup-sessions')(session);

    subscriptions['mongodb:connectionAvailable']();
    subscriptions['mongodb:connectionAvailable']();

    expect(MongoStore).to.have.been.calledOnce;
  });

  it('should use session configuration to configure session', function(done) {
    const sessionConfigMock = {
      secret: 'cats are cute',
      saveUninitialized: true,
      cookie: { maxAge: 1000 }
    };
    const expressSessionMock = sinon.spy();
    const coreMock = {
      db: {
        mongo: {
          isConnected() { return true; }
        }
      },
      logger: { debug() {} },
      pubsub: {
        local: {
          topic() { return { subscribe() {}, publish() {} }; }
        }
      },
      'esn-config': () => ({
        get: () => q.resolve(sessionConfigMock)
      })
    };

    const session = {
      setMiddleware() {
        expect(expressSessionMock).to.have.been.calledWith(sinon.match(sessionConfigMock));
        done();
      }
    };

    mockery.registerMock('../../core', coreMock);
    mockery.registerMock('express-session', expressSessionMock);

    this.helpers.requireBackend('webserver/middleware/setup-sessions')(session);
  });
});
