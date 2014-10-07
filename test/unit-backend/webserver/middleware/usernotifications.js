'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');

describe('The usernotification middleware', function() {

  describe('userCanReadNotification method', function() {
    it('should send back 403 if current user is not in target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        usernotification: {
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

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/usernotifications').userCanReadNotification;
      middleware(req, res, function() {});
    });

    it('should call next if current user is in target', function(done) {
      var id = mongoose.Types.ObjectId();
      var req = {
        user: {
          _id: id
        },
        usernotification: {
          author: mongoose.Types.ObjectId(),
          target: [{objectType: 'user', id: id}]
        }
      };

      var res = {
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/usernotifications').userCanReadNotification;
      middleware(req, res, done);
    });
  });
});
