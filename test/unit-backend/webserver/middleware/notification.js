'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');

describe('The notification middleware', function() {
  describe('userCanReadNotification fn', function() {
    it('should send back 400 if user is not defined in request', function(done) {

      var req = {
        notification: {}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/notification').userCanReadNotification;
      middleware(req, res, function() {});
    });

    it('should send back 400 if notification is not defined in request', function(done) {
      var req = {
        user: {}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/notification').userCanReadNotification;
      middleware(req, res, function() {});
    });

    it('should call next if notification author is the same as current user', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        notification: {
          author: id
        }
      };

      var res = {
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/notification').userCanReadNotification;
      middleware(req, res, done);
    });

    it('should send back 403 if current user is not in target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        notification: {
          author: mongoose.Types.ObjectId(),
          target: []
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/notification').userCanReadNotification;
      middleware(req, res, function() {});
    });

    it('should call next if current user is in target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        notification: {
          author: mongoose.Types.ObjectId(),
          target: [id]
        }
      };

      var res = {
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/notification').userCanReadNotification;
      middleware(req, res, done);
    });
  });
});
