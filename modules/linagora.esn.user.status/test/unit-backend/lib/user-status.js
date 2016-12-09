'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');
const _ = require('lodash');
const CONSTANTS = require('../../../backend/lib/constants');
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
const DEFAULT_CONNECTED_STATE = CONSTANTS.STATUS.DEFAULT_CONNECTED_STATE;
const DISCONNECTION_DELAY = CONSTANTS.STATUS.DISCONNECTION_DELAY;
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
const USER_DISCONNECTION = CONSTANTS.NOTIFICATIONS.USER_DISCONNECTION;

describe.only('The user-status lib', function() {

  var deps, clock, redisGet, redisSet, redisGetResult, connectionTopic, disconnectionTopic, userStateTopic;
  var dependencies = function(name) {
    return deps[name];
  };

  function getUserStatus() {
    const lib = require('../../../backend/lib/user-status')(dependencies);

    lib.init();

    return lib;
  }

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    redisGetResult = null;

    redisGet = sinon.spy(function(key, callback) {
      callback(null, redisGetResult);
    });

    redisSet = sinon.spy(function(key, value, callback) {
      callback(null, null);
    });

    connectionTopic = {
      subscribe: sinon.spy()
    };

    disconnectionTopic = {
      subscribe: sinon.spy()
    };

    userStateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    deps = {
      db: {
        redis: {
          getClient: function(callback) {
            callback(null, {
              hgetall: redisGet,
              hmset: redisSet
            });
          }
        }
      },
      pubsub: {
        local: {
          topic: function(name) {
            if (name === USER_CONNECTION) {
              return connectionTopic;
            } else if (name === USER_DISCONNECTION) {
              return disconnectionTopic;
            }
          }
        },
        global: {
          topic: function(name) {
            if (name === USER_STATE) {
              return userStateTopic;
            }
          }
        }
      }
    };
  });

  afterEach(function() {
    clock.restore();
  });

  describe('The get function', function() {
    it('should return disconnected if no state found in redis', function(done) {
      getUserStatus().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal(DISCONNECTED);
        done();
      }).catch(done);
    });

    it('should return state saved in redis', function(done) {
      redisGetResult = {
        delay: 0,
        since: Date.now(),
        state: 'state'
      };

      getUserStatus().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal('state');
        done();
      }).catch(done);
    });

    it('should return previous state if delay is not passed', function(done) {
      redisGetResult = {
        delay: DISCONNECTION_DELAY,
        since: Date.now(),
        state: 'state',
        previousState: 'previousState'
      };

      getUserStatus().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal('previousState');
        done();
      }).catch(done);
    });

    it('should not return previous state if delay is passed', function(done) {
      redisGetResult = {
        delay: 100,
        since: Date.now(),
        state: 'state',
        previousState: 'previousState'
      };

      clock.tick(101);
      getUserStatus().get('key').then(function(data) {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(data).to.equal('state');
        done();
      }).catch(done);
    });
  });

  function testActionThatShouldRestorePreviousState(action) {
    it('should set DEFAULT_CONNECTED_STATE if nothing store in redis', function(done) {
      action('key').then(function() {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          state: DEFAULT_CONNECTED_STATE
        }));
        done();
      }).catch(done);
    });

    it('should not set anything if no previous state store in redis', function(done) {
      redisGetResult = {
        delay: 0,
        since: Date.now(),
        state: 'state'
      };

      action('key').then(function() {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          state: DEFAULT_CONNECTED_STATE
        }));
        done();
      }).catch(done);
    });

    it('should restore previous state if defined', function(done) {
      redisGetResult = {
        delay: 0,
        since: Date.now(),
        state: 'state',
        previousState: 'previousState'
      };

      action('key').then(function() {
        expect(redisGet).to.have.been.calledWith('userState:key');
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          state: 'previousState',
          delay: 0
        }));
        done();
      }).catch(done);
    });
  }

  describe('the restorePreviousState function', function() {
    testActionThatShouldRestorePreviousState(function(userId) {
      return getUserStatus().restorePreviousState(userId);
    });
  });

  describe('The userConnectionTopic handler', function() {
    testActionThatShouldRestorePreviousState(function(userId) {
      getUserStatus();

      return Q.Promise(function(resolve, reject) {
        expect(connectionTopic.subscribe).to.have.been.calledWith(sinon.match(function(handler) {
          if (_.isFunction(handler)) {
            handler(userId).then(resolve, reject);

            return true;
          }

          return false;
        }));
      });
    });
  });

  function testActionThatDisconnect(action) {
    it('should save previous state when leaving a connected state for disconnected', function(done) {
      redisGetResult = {
        state: 'state',
        previousState: 'a previous state'
      };

      action('key').then(function() {
        expect(redisGet).to.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          previousState: 'state',
          state: DISCONNECTED
        }));
        done();
      }).catch(done);
    });

    it('should not erase previous state when set disconnected to a already disconnected user', function(done) {
      redisGetResult = {
        state: DISCONNECTED,
        previousState: 'previousState'
      };

      action('key').then(function() {
        expect(redisGet).to.have.been.called;
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match({
          previousState: 'previousState',
          state: DISCONNECTED
        }));
        done();
      }).catch(done);
    });
  }

  describe('The userDisconnectionTopic handler', function() {
    testActionThatDisconnect(function(userId) {
      getUserStatus();

      return Q.Promise(function(resolve, reject) {
        expect(disconnectionTopic.subscribe).to.have.been.calledWith(sinon.match(function(handler) {
          if (_.isFunction(handler)) {
            handler(userId).then(resolve, reject);

            return true;
          }

          return false;
        }));
      });
    });

    it('should store the disconnection with a delay of 10 second', function(done) {
      getUserStatus();
      expect(disconnectionTopic.subscribe).to.have.been.calledWith(sinon.match(function(handler) {
        if (_.isFunction(handler)) {
          handler('key').then(function() {
            expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('delay', DISCONNECTION_DELAY));
            done();
          }).catch(done);

          return true;
        }

        return false;
      }));
    });
  });

  describe('set state function', function() {
    it('should store previous state', function(done) {
      getUserStatus().set('key', 'state').then(function() {
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('state', 'state'));
        done();
      }).catch(done);
    });

    it('if given delay it should store it', function(done) {
      getUserStatus().set('key', 'state', 42).then(function() {
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('delay', 42));
        done();
      }).catch(done);
    });

    it('should store the moment where it has been store', function(done) {
      var now = 42;

      clock.tick(now);
      getUserStatus().set('key', 'state').then(function() {
        expect(redisSet).to.have.been.calledWith('userState:key', sinon.match.has('since', 42));
        done();
      }).catch(done);
    });

    it('should publish on user:state the new user state immediately if no delay', function(done) {
      getUserStatus().set('key', 'state', 0).then(function() {
        expect(userStateTopic.publish).to.have.been.calledWith({
          userId: 'key',
          state: 'state'
        });
        done();
      }).catch(done);
    });

    it('should publish on user:state the new user state only after given delay if not null', function(done) {
      var delay = 1664;

      getUserStatus().set('key', 'state', delay).then(function() {
        expect(userStateTopic.publish).to.not.have.been.called;
        clock.tick(delay);
        expect(userStateTopic.publish).to.have.been.calledWith({
          userId: 'key',
          state: 'state'
        });

        done();
      }).catch(done);
    });

    it('should delete previous delayed status', function(done) {
      var delay = 1664;
      var userStateLib = getUserStatus();

      userStateLib.set('key', 'delayedState', delay).then(function() {
        return userStateLib.set('key', 'state').then(function() {
          expect(userStateTopic.publish).to.have.been.calledWith({
            userId: 'key',
            state: 'state'
          });

          clock.tick(delay);
          expect(userStateTopic.publish).to.not.have.been.calledWith({
            userId: 'key',
            state: 'delayedState'
          });

          done();
        });
      }).catch(done);
    });

    it('should replace previous delayed status by new delayed status if delay is not null', function(done) {
      var delay = 1664;
      var userStateLib = getUserStatus();

      userStateLib.set('key', 'delayedState', 1).then(function() {
        return userStateLib.set('key', 'state', delay).then(function() {
          clock.tick(delay + 1);
          expect(userStateTopic.publish).to.not.have.been.calledWith({
            userId: 'key',
            state: 'delayedState'
          });

          expect(userStateTopic.publish).to.have.been.calledWith({
            userId: 'key',
            state: 'state'
          });

          done();
        });
      }).catch(done);
    });

    testActionThatDisconnect(function(userId) {
      return getUserStatus().set(userId, DISCONNECTED);
    });

  });
});
