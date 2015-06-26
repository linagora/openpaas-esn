'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

describe('The addressbooks controller', function() {

  var deps, dependencies;
  var logger = {
    debug: console.log,
    info: console.log,
    error: console.log,
    warn: console.log
  };

  var req = {
    params: {
      contactId: '123',
      bookId: '456'
    }
  };

  function getController() {
    return require('../../../../backend/webserver/addressbooks/controller')(dependencies);
  }

  beforeEach(function() {
    mockery.registerMock('./actions', function() {});
    deps = {
      logger: logger
    };
    dependencies = function(name) {
      return deps[name];
    };
  });

  describe('The remove function', function() {
    it('should create a grace period task', function(done) {
      var defer = q.defer();
      defer.resolve({});

      deps.graceperiod = {
        create: function() {
          done();
          return defer.promise;
        }
      };
      getController().remove(req, {});
    });

    it('should send HTTP 202 whn grace period task is successfully created', function(done) {
      var task = {
        id: '222'
      };
      var defer = q.defer();
      defer.resolve(task);
      deps.graceperiod = {
        create: function() {
          return defer.promise;
        }
      };

      var res = {
        set: function(name, value) {
          expect(name).to.equal('x-esn-task-id');
          expect(value).to.equal(task.id);
        },

        json: function(code, payload) {
          expect(code).to.equal(202);
          expect(payload.id).to.equal(task.id);
          done();
        }
      };

      getController().remove(req, res);
    });

    it('should send HTTP 500 when grace period task creation fails', function(done) {
      var defer = q.defer();
      defer.reject(new Error());
      deps.graceperiod = {
        create: function() {
          return defer.promise;
        }
      };

      var res = {
        set: function() {
          done(new Error());
        },

        json: function(code, payload) {
          expect(code).to.equal(500);
          expect(payload.error.details).to.match(/Can not get create deferred task/);
          done();
        }
      };
      getController().remove(req, res);
    });
  });
});
