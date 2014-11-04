'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');

describe('The usernotification middleware', function() {

  describe('userCanReadNotification method', function() {
    it('should send back 403 if current user is not the target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        usernotification: {
          author: mongoose.Types.ObjectId(),
          target: null
        }
      };

      var res = {
        json: function(code, message) {
          expect(code).to.equal(403);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(403);
          expect(message.error.details).to.exists;
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/usernotifications').userCanReadNotification;
      middleware(req, res, function() {});
    });

    it('should call next if current user is target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        usernotification: {
          author: mongoose.Types.ObjectId(),
          target: id
        }
      };

      var res = {
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/usernotifications').userCanReadNotification;
      middleware(req, res, done);
    });
  });

  describe('userCanReadAllNotifications method', function() {
    it('should send back 403 if current user is not in one usernotification target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: { _id: id },
        usernotifications: [
          { author: mongoose.Types.ObjectId(), target: mongoose.Types.ObjectId() },
          { author: mongoose.Types.ObjectId(), target: id }
        ]
      };

      var res = {
        json: function(code, message) {
          expect(code).to.equal(403);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(403);
          expect(message.error.details).to.exists;
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/usernotifications').userCanReadAllNotifications;
      middleware(req, res, function() {});
    });

    it('should call next if current user is in all target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: { _id: id },
        usernotifications: [
          { author: mongoose.Types.ObjectId(), target: id },
          { author: mongoose.Types.ObjectId(), target: id },
          { author: mongoose.Types.ObjectId(), target: id }
        ]
      };

      var res = {};

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/usernotifications').userCanReadAllNotifications;
      middleware(req, res, done);
    });
  });
});
