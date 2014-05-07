'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystream middleware', function() {

  describe('The findStreamResource fn', function() {

    it('should send an error if uuid is not set', function(done) {
      var mock = {
        model: function() {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              return cb(new Error());
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
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

    it('should send back an error if Domain.getFromActivityStreamID send back an error', function(done) {
      var mock = {
        model: function() {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              return cb(new Error());
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
          uuid: 1
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

    it('should send back an error if Domain.getFromActivityStreamID does not return domain', function(done) {
      var mock = {
        model: function() {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              return cb(null, null);
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
          uuid: 1
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should call next when stream resource is found', function(done) {
      var mock = {
        model: function() {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              return cb(null, {_id: 123});
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
          uuid: 1
        }
      };
      var res = {
        json: function() {
          done(new Error('Should not be called'));
        }
      };
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });
  });
});
