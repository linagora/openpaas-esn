'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystream middleware', function() {

  describe('The filterValidTargets fn', function() {
    it('should send an error if targets is not set', function(done) {
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterValidTargets;
      var req = {
        body: {
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

    it('should send an error if targets is empty', function(done) {
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterValidTargets;
      var req = {
        body: {
          targets: []
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

    it('should send an error if targets is undefined', function(done) {
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterValidTargets;
      var req = {
        body: {
          targets: undefined
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

    it('should not filter valid targets', function(done) {
      var mock = {
        model: function() {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              return cb(null, {_id: uuid});
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterValidTargets;
      var req = {
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: '1'
            },
            {
              objectType: 'activitystream',
              id: '2'
            }
          ]
        }
      };
      var res = {
        json: function(code) {
        }
      };
      var next = function() {
        expect(req.body.targets.length).to.equal(2);
        done();
      };
      middleware(req, res, next);
    });

    it('should filter invalid targets', function(done) {
      var mock = {
        model: function() {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              if (uuid === '1') {
                return cb(null, {_id: uuid});
              } else {
                return cb();
              }
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterValidTargets;
      var req = {
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: '1'
            },
            {
              objectType: 'activitystream',
              id: '2'
            }
          ]
        }
      };
      var res = {
        json: function(code) {
        }
      };
      var next = function() {
        expect(req.body.targets.length).to.equal(1);
        expect(req.body.targets[0].id).to.equal('1');
        done();
      };
      middleware(req, res, next);
    });

    it('should be passthrough if inReplyTo is in the body', function(done) {
      var mock = {
        model: function() {
          return {};
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterValidTargets;
      var req = {
        body: {
          targets: undefined,
          inReplyTo: 'reply'
        }
      };
      var next = function() {
        done();
      };
      middleware(req, {}, next);
    });
  });

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
