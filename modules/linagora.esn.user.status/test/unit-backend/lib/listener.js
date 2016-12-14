'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');
const _ = require('lodash');
const CONSTANTS = require('../../../backend/lib/constants');
const USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
const USER_DISCONNECTION = CONSTANTS.NOTIFICATIONS.USER_DISCONNECTION;
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
const DISCONNECTION_DELAY = CONSTANTS.STATUS.DISCONNECTION_DELAY;

describe('The user-status listener lib', function() {

  let connectionTopic, disconnectionTopic, pubsub;
  const userId = '123';
  const state = {
    toJSON: function() {
      return {current_status: 'connected'};
    }
  };

  beforeEach(function() {
    connectionTopic = {
      subscribe: sinon.spy()
    };

    disconnectionTopic = {
      subscribe: sinon.spy()
    };

    pubsub = {
      local: {
        topic: function(name) {
          if (name === USER_CONNECTION) {
            return connectionTopic;
          } else if (name === USER_DISCONNECTION) {
            return disconnectionTopic;
          }
        }
      }
    };
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.user.status/backend/lib';
    this.moduleHelpers.addDep('pubsub', pubsub);
  });

  describe('The userConnectionTopic handler', function() {
    it('should restorePreviousStatusOfUser on event', function() {
      const state = {
        toJSON: function() {
          return {current_status: 'connected'};
        }
      };
      const restorePreviousStatusOfUser = sinon.spy(function(userId) {
        return Q.when(state);
      });
      const module = require(this.moduleHelpers.backendPath + '/listener')(this.moduleHelpers.dependencies, {userStatus: {restorePreviousStatusOfUser: restorePreviousStatusOfUser}});

      module.start();

      expect(connectionTopic.subscribe).to.have.been.calledWith(sinon.match(function(handler) {
        if (_.isFunction(handler)) {
          handler(userId);

          return true;
        }

        return false;
      }));
      expect(restorePreviousStatusOfUser).to.have.been.calledWith(userId);
    });
  });

  describe('The userDisconnectionTopic handler', function() {
    it('should set the user status to disconnected', function() {
      const set = sinon.spy(function(userId, status, delay) {
        return Q.when(state);
      });
      const module = require(this.moduleHelpers.backendPath + '/listener')(this.moduleHelpers.dependencies, {userStatus: {set: set}});

      module.start();

      expect(disconnectionTopic.subscribe).to.have.been.calledWith(sinon.match(function(handler) {
        if (_.isFunction(handler)) {
          handler(userId);

          return true;
        }

        return false;
      }));
      expect(set).to.have.been.calledWith(userId, DISCONNECTED, DISCONNECTION_DELAY);
    });
  });
});
