'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');
const _ = require('lodash');
const CONSTANTS = require('../../../backend/lib/constants');
const USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const CONNECTED = CONSTANTS.STATUS.CONNECTED;

describe('The user-status listener lib', function() {

  const userId = '123';
  let connectionTopic, stateTopic, pubsub;

  beforeEach(function() {
    connectionTopic = {
      subscribe: sinon.spy()
    };

    stateTopic = {
      publish: sinon.spy()
    };

    pubsub = {
      local: {
        topic: function(name) {
          if (name === USER_CONNECTION) {
            return connectionTopic;
          }
        }
      },
      global: {
        topic: function(name) {
          if (name === USER_STATE) {
            return stateTopic;
          }
        }
      }
    };
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.user.status/backend/lib';
    this.moduleHelpers.addDep('pubsub', pubsub);
  });

  describe('The userConnected function', function() {
    it('should updateLastActiveForUser and publish in global topic', function(done) {
      const updateLastActiveForUser = sinon.spy(function() {
        return Q();
      });

      const module = require(this.moduleHelpers.backendPath + '/listener')(this.moduleHelpers.dependencies, {userStatus: {updateLastActiveForUser: updateLastActiveForUser}});

      module.userConnected(userId).then(function(result) {
        expect(result).to.deep.equals({_id: userId, status: CONNECTED});
        expect(stateTopic.publish).to.have.been.calledWith({_id: userId, status: CONNECTED});
        done();
      }, done);
    });

    it('should not publish in global topic if updateLastActiveForUser fails', function(done) {
      const err = new Error('I failed');
      const updateLastActiveForUser = sinon.spy(function() {
        return Q.reject(err);
      });

      const module = require(this.moduleHelpers.backendPath + '/listener')(this.moduleHelpers.dependencies, {userStatus: {updateLastActiveForUser: updateLastActiveForUser}});

      module.userConnected(userId).then(function() {
        done(new Error('Should not be called'));
      }, function(err) {
        expect(err.message).to.equals('I failed');
        expect(stateTopic.publish).to.not.have.been.called;
        done();
      });
    });
  });

  describe('The userConnectionTopic handler', function() {
    it('should update the last active timestamp on event', function() {
      const updateLastActiveForUser = sinon.spy(function() {
        return Q.when();
      });
      const module = require(this.moduleHelpers.backendPath + '/listener')(this.moduleHelpers.dependencies, {userStatus: {updateLastActiveForUser: updateLastActiveForUser}});

      module.start();

      expect(connectionTopic.subscribe).to.have.been.calledWith(sinon.match(function(handler) {
        if (_.isFunction(handler)) {
          handler(userId);

          return true;
        }

        return false;
      }));
      expect(updateLastActiveForUser).to.have.been.calledWith(userId);
      expect(stateTopic.publish).to.not.have.been.called;
    });
  });
});
