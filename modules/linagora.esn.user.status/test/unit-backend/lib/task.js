'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

describe('The user-status stack lib', function() {

  let userStateTopic, pubsub, clock;
  const userId = '123';
  const delay = 100;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    userStateTopic = {
      publish: sinon.spy()
    };

    pubsub = {
      global: {
        topic: function(name) {
          return userStateTopic;
        }
      }
    };
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.user.status/backend/lib';
    this.moduleHelpers.addDep('pubsub', pubsub);
  });

  afterEach(function() {
    clock.restore();
  });

  describe('The publishStatus function', function() {
    beforeEach(function() {
      this.module = require(this.moduleHelpers.backendPath + '/task')(this.moduleHelpers.dependencies);
    });

    it('should not publish when currentStatus is the same as previous one', function() {
      const status = 'connected';

      this.module.publishStatus(userId, {current_status: status}, {current_status: status});
      expect(userStateTopic.publish).to.not.have.been.called;
    });

    it('should not publish when currentStatus is disconnected and there are no previous status', function() {
      this.module.publishStatus(userId, null, {current_status: 'disconnected'});
      expect(userStateTopic.publish).to.not.have.been.called;
    });

    it('should publish with delay when delay is defined', function() {
      const currentStatus = {current_status: 'disconnected'};

      this.module.publishStatus(userId, {current_status: 'connected'}, currentStatus, delay);
      expect(userStateTopic.publish).to.not.have.been.called;
      clock.tick(delay);
      expect(userStateTopic.publish).to.have.been.calledWith({userId: userId, status: currentStatus});
    });

    it('should abort previous delayed task when publishStatus is called again before the end of the delay', function() {
      const currentStatus = {current_status: 'disconnected'};
      const previousStatus = {current_status: 'connected'};

      this.module.publishStatus(userId, previousStatus, currentStatus, delay);
      expect(userStateTopic.publish).to.not.have.been.called;
      clock.tick(delay - 1);
      currentStatus.current_status = 'updated';
      this.module.publishStatus(userId, previousStatus, currentStatus, delay);
      expect(userStateTopic.publish).to.not.have.been.called;
      clock.tick(delay);
      expect(userStateTopic.publish).to.have.been.called.once;
      expect(userStateTopic.publish).to.have.been.calledWith({userId: userId, status: currentStatus});
    });

    it('should publish without delay when delay is not defined', function() {
      const currentStatus = {current_status: 'disconnected'};

      this.module.publishStatus(userId, {current_status: 'connected'}, currentStatus);

      expect(userStateTopic.publish).to.have.been.calledWith({userId: userId, status: currentStatus});
    });
  });
});
