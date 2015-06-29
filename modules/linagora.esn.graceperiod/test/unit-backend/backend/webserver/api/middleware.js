'use strict';

var chai = require('chai');
var expect = chai.expect;
var q = require('q');

describe('The graceperiod middleware', function() {

  var deps, dependencies, lib;

  function getMiddleware() {
    return require('../../../../../backend/webserver/api/middleware')(lib, dependencies);
  }

  beforeEach(function() {
    deps = {
      logger: {
        debug: function() {},
        error: function() {}
      },
      auth: {
        token: {}
      }
    };

    dependencies = function(name) {
      return deps[name];
    };

    lib = {};
  });

  describe('The load function', function() {

    it('should send back HTTP 404 when task is not found', function(done) {
      lib.registry = {
        get: function() {
          return q();
        }
      };
      getMiddleware().load({params: {id: 1}}, {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      });
    });

    it('should send back HTTP 500 when error occurs while retrieving task', function(done) {
      var defer = q.defer();
      defer.reject(new Error());
      lib.registry = {
        get: function() {
          return defer.promise;
        }
      };
      getMiddleware().load({params: {id: 1}}, {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      });
    });

    it('should set the task in the request and call next', function(done) {
      var task = {id: 123};
      var req = {params: {id: 1}};

      var defer = q.defer();
      defer.resolve(task);
      lib.registry = {
        get: function() {
          return defer.promise;
        }
      };
      getMiddleware().load(req, {
        json: function() {
          done(new Error('Should not call res.json'));
        }
      }, function() {
        expect(req.task).to.deep.equal(task);
        done();
      });
    });
  });

  describe('The isUserTask function', function() {

    it('should send back HTTP 404 when task is undefined', function(done) {
      getMiddleware().isUserTask({}, {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      });
    });

    it('should send back HTTP 500 when getToken fails', function(done) {
      deps.auth.token.getToken = function(id, callback) {
        return callback(new Error());
      };

      getMiddleware().isUserTask({user: {_id: 123}, task: {id: 1}}, {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      });
    });

    it('should send back HTTP 404 when token is not found', function(done) {
      deps.auth.token.getToken = function(id, callback) {
        return callback();
      };

      getMiddleware().isUserTask({user: {_id: 123}, task: {id: 1}}, {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      });
    });

    it('should send back HTTP 403 when task is not user one', function(done) {
      var userId = 1;
      deps.auth.token.getToken = function(id, callback) {
        return callback(null, {token: 2, user: '3'});
      };

      getMiddleware().isUserTask({user: {_id: userId}, task: {id: 1}}, {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      });
    });

    it('should call next when task is user one', function(done) {
      var userId = 1;
      deps.auth.token.getToken = function(id, callback) {
        return callback(null, {token: 2, user: userId + ''});
      };

      getMiddleware().isUserTask({user: {_id: userId}, task: {id: 1}}, {
        json: function() {
          done(new Error());
        }
      }, done);
    });
  });
});
