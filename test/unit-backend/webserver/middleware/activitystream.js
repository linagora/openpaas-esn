'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystream middleware', function() {


  describe.skip('The filterWritableTargets fn', function() {
  });

  describe.skip('The findStreamResource fn', function() {
  });

  describe('The isValidStream fn', function() {
    it('should send back 400 if req.query.objectType is not set', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          id: 1
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should send back 400 if req.query.id is not set', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should send back 500 if as#getUserStreams fails', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, options, callback) {
          return callback(new Error());
        }
      });

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: 2
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should send back 400 if as#getUserStreams does not send back any stream', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, options, callback) {
          return callback();
        }
      });

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: 2
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should call next if stream is found', function(done) {
      var id = 123;
      var streams = [
        {uuid: 983983},
        {uuid: id}
      ];
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, options, callback) {
          return callback(null, streams);
        }
      });

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: id
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

    it('should send back 400 if stream is not found', function(done) {
      var id = 123;
      var streams = [
        {uuid: 983983},
        {uuid: 345}
      ];
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, options, callback) {
          return callback(null, streams);
        }
      });

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: id
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res, function() {
        return done(new Error());
      });
    });
  });
});
