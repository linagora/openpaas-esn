'use strict';

var mockery = require('mockery');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

describe('The contact import cron module', function() {
  var deps, userModuleMock, cronModuleMock, importModuleMock, cronConfigMock, registryMock;

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../../backend/lib/cron')(dependencies);
  };

  beforeEach(function() {
    userModuleMock = {
      list: function() {}
    };
    cronModuleMock = {
      submit: function() {}
    };
    cronConfigMock = {};
    deps = {
      logger: {
        debug: function() {},
        info: function() {},
        error: function() {}
      },
      cron: cronModuleMock,
      user: userModuleMock,
      config: function() {
        return {
          contactsync: cronConfigMock
        };
      }
    };

    importModuleMock = {
      synchronizeAccountContactsByJobQueue: function() {}
    };
    mockery.registerMock('../import', function() {
      return importModuleMock;
    });

    registryMock = {
      list: function() {
        return [];
      }
    };
    mockery.registerMock('../registry', function() {
      return registryMock;
    });

  });

  describe('The init fn', function() {
    var ACCOUNT_TYPE = 'twitter';

    it('should reject if Contact Synchronization cron job is not active', function(done) {
      cronConfigMock = { active: false };
      getModule().init().then(done.bind(null, 'should not resolve'), function(err) {
        expect(err.message).to.equal('Contact Synchronization is not active');
        done();
      });
    });

    it('should create cron job to synchronize contacts', function(done) {
      var jobId = 111;
      cronConfigMock = {
        active: true,
        expression: '0 0 0 * * *',
        description: 'Contact Sync'
      };
      cronModuleMock.submit = function(description, cronTime, job, onComplete, callback) {
        expect(description).to.equal(cronConfigMock.description);
        expect(cronTime).to.equal(cronConfigMock.expression);
        expect(job).to.be.function;
        expect(onComplete).to.be.function;
        expect(callback).to.be.function;
        callback(null, { id: jobId });
      };
      getModule().init(ACCOUNT_TYPE).then(function(id) {
        expect(id).to.equal(jobId);
        done();
      }, done);

    });

    it('should have job to get all users by calling user module', function(done) {
      cronConfigMock = { active: true };
      userModuleMock.list = function() {
        done();
      };
      cronModuleMock.submit = function(description, cronTime, job, onComplete, callback) {
        job(function() {});
      };
      getModule().init(ACCOUNT_TYPE);
    });

    it('should have job to synchronize contact for each accounts of the users', function(done) {
      cronConfigMock = { active: true };
      var importers = {};
      importers[ACCOUNT_TYPE] = 'this is a importer';
      registryMock.list = function() {
        return importers;
      };
      var user1 = {
        _id: 'user1',
        accounts: [{
          data: {
            provider: ACCOUNT_TYPE,
            id: 1
          }
        }, {
          data: {
            provider: 'facebook',
            id: 2
          }
        }]
      };
      var user2 = {
        _id: 'user2',
        accounts: [{
          data: {
            provider: ACCOUNT_TYPE,
            id: 3
          }
        }]
      };
      var users = [user1, user2];
      userModuleMock.list = function(callback) {
        callback(null, users);
      };
      importModuleMock.synchronizeAccountContactsByJobQueue = sinon.spy();
      cronModuleMock.submit = function(description, cronTime, job, onComplete, callback) {
        job(function() {
          expect(importModuleMock.synchronizeAccountContactsByJobQueue.callCount).to.equal(2);
          expect(importModuleMock.synchronizeAccountContactsByJobQueue).to.have.been.calledWith(user1, user1.accounts[0]);
          expect(importModuleMock.synchronizeAccountContactsByJobQueue).to.have.been.calledWith(user2, user2.accounts[0]);
          done();
        });

      };
      getModule().init(ACCOUNT_TYPE);
    });

    it('should have job to synchronize contact for each contact importers', function(done) {
      cronConfigMock = { active: true };
      var importers = {
        twitter: 'twitter importer',
        facebook: 'facebook importer'
      };
      registryMock.list = function() {
        return importers;
      };
      var user = {
        _id: 'user',
        accounts: [{
          data: {
            provider: 'twitter',
            id: 1
          }
        }, {
          data: {
            provider: 'google',
            id: 2
          }
        }, {
          data: {
            provider: 'facebook',
            id: 3
          }
        }]
      };
      var users = [user];
      userModuleMock.list = function(callback) {
        callback(null, users);
      };
      importModuleMock.synchronizeAccountContactsByJobQueue = sinon.spy();
      cronModuleMock.submit = function(description, cronTime, job, onComplete, callback) {
        job(function() {
          expect(importModuleMock.synchronizeAccountContactsByJobQueue.callCount).to.equal(2);
          expect(importModuleMock.synchronizeAccountContactsByJobQueue).to.have.been.calledWith(user, user.accounts[0]);
          expect(importModuleMock.synchronizeAccountContactsByJobQueue).to.have.been.calledWith(user, user.accounts[2]);
          done();
        });

      };
      getModule().init(ACCOUNT_TYPE);
    });
  });

});
