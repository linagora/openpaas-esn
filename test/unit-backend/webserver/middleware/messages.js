'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The messages middleware', function() {
  describe('The canReplyTo fn', function() {
    it('should call next if req.body.replyTo is undefined', function(done) {
      mockery.registerMock('../../core/message/permission', {});
      mockery.registerMock('../../core/message', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/message').canReplyTo;
      var req = {
        body: {
        }
      };
      middleware(req, {}, done);
    });

    it('should send back 400 if messageModule.get returns error', function(done) {
      mockery.registerMock('../../core/message/permission', {});
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(new Error());
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 if messageModule.get returns null message', function(done) {
      mockery.registerMock('../../core/message/permission', {});
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback();
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 if messagePermission.canReply returns error', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(new Error());
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 if messagePermission.canReply returns false', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(null, false);
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if messagePermission.canReply returns true', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(null, true);
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });
  });
});
