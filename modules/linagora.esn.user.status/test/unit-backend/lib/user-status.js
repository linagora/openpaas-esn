'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');
const CONSTANTS = require('../../../backend/lib/constants');
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
const DEFAULT_CONNECTED_STATE = CONSTANTS.STATUS.DEFAULT_CONNECTED_STATE;

describe('The user-status lib', function() {

  let clock, db, UserStatus, publishSpy;
  const userId = '123';
  const delay = 100;

  beforeEach(function() {
    publishSpy = sinon.spy();
    UserStatus = {};
    db = {
      mongo: {
        mongoose: {
          model: function(name) {
            return UserStatus;
          }
        }
      }
    };
    clock = sinon.useFakeTimers();
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.user.status/backend/lib';
    this.moduleHelpers.addDep('db', db);
  });

  afterEach(function() {
    clock.restore();
  });

  describe('The get function', function() {
    it('should return disconnected if no status found', function(done) {
      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when();
      });
      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies);
      this.module.get(userId).then(result => {
        expect(UserStatus.findById).to.have.been.calledWith(userId);
        expect(result).to.equal(DISCONNECTED);
        done();
      }).catch(done);
    });

    it('should return previous status if delay is not over', function(done) {
      const status = 'mystatus';

      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when({previous_status: status, timestamps: {last_update: Date.now()}, delay: delay});
      });
      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies);
      clock.tick(delay - 1);
      this.module.get(userId).then(result => {
        expect(UserStatus.findById).to.have.been.calledWith(userId);
        expect(result).to.equal(status);
        done();
      }).catch(done);
    });

    it('should return disconnected if delay is not over but previous status does not exist', function(done) {
      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when({timestamps: {last_update: Date.now()}, delay: delay});
      });
      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies);
      clock.tick(delay - 1);
      this.module.get(userId).then(result => {
        expect(UserStatus.findById).to.have.been.calledWith(userId);
        expect(result).to.equal(DISCONNECTED);
        done();
      }).catch(done);
    });

    it('should return current_status if delay is over', function(done) {
      const current = 'mycurrentstatus';

      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when({current_status: current, timestamps: {last_update: 0}, delay: delay});
      });
      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies);
      clock.tick(delay + 1);
      this.module.get(userId).then(result => {
        expect(UserStatus.findById).to.have.been.calledWith(userId);
        expect(result).to.equal(current);
        done();
      }).catch(done);
    });
  });

  describe('The set function', function() {
    it('should update the status from the previous status when disconnected', function(done) {
      const status = DISCONNECTED;
      const previousStatus = 'previousStatus';
      const previous = {
        current_status: previousStatus
      };
      const updatedStatus = 'updatedStatus';

      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when(previous);
      });
      UserStatus.findOneAndUpdate = sinon.spy(function() {
        return Q.when(updatedStatus);
      });

      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies, {task: {publishStatus: publishSpy}});
      this.module.set(userId, status, delay).then(result => {
        const nextStatus = {
          current_status: status,
          timestamps: {last_update: 0},
          delay: delay,
          previous_status: previousStatus
        };

        expect(UserStatus.findOneAndUpdate).to.have.been.calledWith({_id: userId}, {$set: nextStatus}, {new: true, upsert: true, setDefaultsOnInsert: true});
        expect(publishSpy).to.have.been.calledWith(userId, previous, updatedStatus, delay);
        done();
      }).catch(done);
    });

    it('should not save a previous status when no previous status is available', function(done) {
      const status = DISCONNECTED;
      const updatedStatus = 'updatedStatus';

      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when();
      });
      UserStatus.findOneAndUpdate = sinon.spy(function() {
        return Q.when(updatedStatus);
      });

      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies, {task: {publishStatus: publishSpy}});
      this.module.set(userId, status, delay).then(result => {
        const nextStatus = {
          current_status: status,
          timestamps: {last_update: 0},
          delay: delay
        };

        expect(UserStatus.findOneAndUpdate).to.have.been.calledWith({_id: userId}, {$set: nextStatus}, {new: true, upsert: true, setDefaultsOnInsert: true});
        expect(publishSpy).to.have.been.calledWith(userId, undefined, updatedStatus, delay);
        done();
      }).catch(done);
    });
  });

  describe('The restorePreviousStatusOfUser function', function() {
    it('should set status to previous one if exists', function(done) {
      const status = 'a status';
      const previousStatus = {previous_status: status};
      const nextStatus = {
        current_status: status,
        timestamps: {last_update: 0},
        delay: 0
      };

      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when(previousStatus);
      });
      UserStatus.findOneAndUpdate = sinon.spy(function() {
        return Q.when(nextStatus);
      });

      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies, {task: {publishStatus: publishSpy}});
      this.module.restorePreviousStatusOfUser(userId).then(() => {
        expect(UserStatus.findOneAndUpdate).to.have.been.calledWith({_id: userId}, {$set: nextStatus}, {new: true, upsert: true, setDefaultsOnInsert: true});
        expect(publishSpy).to.have.been.calledWith(userId, previousStatus, nextStatus, 0);
        done();
      }).catch(done);
    });

    it('should set status to default when previous does not exists', function(done) {
      const status = 'a status';
      const nextStatus = {
        current_status: status,
        timestamps: {last_update: 0},
        delay: 0
      };

      UserStatus.findById = sinon.spy(function(userId) {
        return Q.when();
      });
      UserStatus.findOneAndUpdate = sinon.spy(function() {
        return Q.when(nextStatus);
      });

      this.module = require(this.moduleHelpers.backendPath + '/user-status')(this.moduleHelpers.dependencies, {task: {publishStatus: publishSpy}});
      this.module.restorePreviousStatusOfUser(userId).then(() => {
        const expected = {
          current_status: DEFAULT_CONNECTED_STATE,
          timestamps: {last_update: Date.now()},
          delay: 0
        };

        expect(UserStatus.findOneAndUpdate).to.have.been.calledWith({_id: userId}, {$set: expected}, {new: true, upsert: true, setDefaultsOnInsert: true});
        expect(publishSpy).to.have.been.calledWith(userId, undefined, nextStatus, 0);
        done();
      }).catch(done);
    });
  });
});
