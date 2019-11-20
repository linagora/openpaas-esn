'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

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

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          id: 1
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
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

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
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

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: 2
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );
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

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: 2
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
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

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').isValidStream;
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

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').isValidStream;
      var req = {
        query: {
          objectType: 1,
          id: id
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res, function() {
        return done(new Error());
      });
    });
  });

  describe('The addStreamResourceFinder fn', function() {
    let streamFinderMock;

    beforeEach(function() {
      this.helpers.mock.models({
        timelineentry: {},
        authtoken: {},
        user: {},
        domain: {},
        resourcelink: {},
        passwordreset: {},
        notification: {}
      });

      streamFinderMock = {};

      mockery.registerMock('composable-middleware', () => streamFinderMock);

    });

    it('should use finder', function() {
      var finder = {};

      streamFinderMock.use = sinon.spy();
      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream');

      middleware.addStreamResourceFinder(finder);

      expect(streamFinderMock.use).to.have.been.calledWith(finder);
    });
  });

  describe('The addStreamWritableFinder fn', function() {
    let writableFinderMock;

    beforeEach(function() {
      this.helpers.mock.models({
        timelineentry: {},
        authtoken: {},
        user: {},
        domain: {},
        resourcelink: {},
        passwordreset: {},
        notification: {}
      });

      writableFinderMock = {};
      mockery.registerMock('composable-middleware', () => writableFinderMock);
    });

    it('should use finder', function() {
      var finder = {};

      writableFinderMock.use = sinon.spy();
      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream');

      middleware.addStreamWritableFinder(finder);

      expect(writableFinderMock.use).to.have.been.calledWith(finder);
    });
  });
});
