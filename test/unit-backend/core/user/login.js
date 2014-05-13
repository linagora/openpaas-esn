'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The user login module', function() {
  var mockModels, mockPubSub;

  beforeEach(function() {
    mockModels = this.helpers.mock.models;
    mockPubSub = this.helpers.mock.pubsub;
  });

  describe('The success function', function() {

    beforeEach(function() {
      mockery.registerMock('../esn-config', function() {});
    });

    it('should call loginSuccess of a mongoose User model', function(done) {
      var called = false;
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            var user = {
              loginSuccess: function(callback) {
                called = true;
                callback();
              }
            };
            callback(null, user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.success('email', function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        expect(pubSubStub.topics).to.include('login:success');
        expect(pubSubStub.topics['login:success'].data[0].loginSuccess).to.be.a.function;
        done();
      });
    });

    it('should propagate err on error', function(done) {
      var called = false;
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            var user = {
              loginSuccess: function(callback) {
                called = true;
                callback();
              }
            };
            callback(new Error('ERROR'), user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.success('email', function(err) {
        expect(err).to.exist;
        expect(called).to.be.false;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

    it('should fail if no user is retrieved from the database', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.success('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

  });

  describe('The failure function', function() {

    beforeEach(function() {
      mockery.registerMock('../esn-config', function() {});
    });

    it('should call loginFailuer of a mongoose User model', function(done) {
      var called = false;
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            var user = {
              loginFailure: function(callback) {
                called = true;
                callback();
              }
            };
            callback(null, user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.failure('email', function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        expect(pubSubStub.topics).to.include('login:failure');
        expect(pubSubStub.topics['login:failure'].data[0].loginFailure).to.be.a.function;
        done();
      });
    });

    it('should propagate err on error', function(done) {
      var called = false;
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            var user = {
              loginFailure: function(callback) {
                called = true;
                callback();
              }
            };
            callback(new Error('ERROR'), user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.failure('email', function(err) {
        expect(err).to.exist;
        expect(called).to.be.false;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

    it('should fail if no user is retrieved from the database', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.failure('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

  });

  describe('The canLogin function', function() {

    beforeEach(function() {
      mockery.registerMock('../esn-config', function() {
        return {
          get: function(callback) {
            var data = {
              failure: {
                size: 5
              }
            };
            callback(null, data);
          }
        };
      });
    });

    it('should return true if size is lower than configured value', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(null, {
              login: {
                failures: [1, 2, 3, 4]
              }
            });
          }
        }
      });

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should return false if size is equal to configured value', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(null, {
              login: {
                failures: [1, 2, 3, 4, 5]
              }
            });
          }
        }
      });

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should return false if size is greater than default value', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(null, {
              login: {
                failures: [1, 2, 3, 4, 5, 6]
              }
            });
          }
        }
      });

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should propagate err on error', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(new Error('ERROR'), {});
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

    it('should fail if no user is retrieved from the database', function(done) {
      mockModels({
        'User': {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub(pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

  });
});
