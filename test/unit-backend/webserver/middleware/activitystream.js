'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystream middleware', function() {

  describe('The filterWritableTargets fn', function() {
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
      mockery.registerMock('../../core/activitystreams', {});
        var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
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
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
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
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
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

    it('should not filter valid and writable targets', function(done) {
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
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      });

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
      var req = {
        user: {},
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

    it('should filter invalid targets and keep writable targets', function(done) {
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
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
      var req = {
        user: {},
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

    it('should filter unwritable targets', function(done) {
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
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, community._id > 10);
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
      var req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: 1
            },
            {
              objectType: 'activitystream',
              id: 2
            },
            {
              objectType: 'activitystream',
              id: 3
            },
            {
              objectType: 'activitystream',
              id: 11
            },
            {
              objectType: 'activitystream',
              id: 12
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

    it('should send 403 if no valid streams are set', function(done) {
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
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, false);
        }
      });
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
      var req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: 1
            },
            {
              objectType: 'activitystream',
              id: 2
            },
            {
              objectType: 'activitystream',
              id: 3
            },
            {
              objectType: 'activitystream',
              id: 11
            },
            {
              objectType: 'activitystream',
              id: 12
            }
          ]
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      var next = function() {
        done(new Error());
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
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').filterWritableTargets;
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
      mockery.registerMock('../../core/activitystreams', {});
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

    it('should send back an error if Communtity.getFromActivityStreamID send back error', function(done) {
      var mock = {
        model: function(modelName) {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              if (modelName === 'Domain') {
                return cb(null, null);
              }

              expect(modelName).to.equal('Community');
              return cb(new Error());
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {});

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

    it('should call next when stream resource is found (Community)', function(done) {
      var mock = {
        model: function(modelName) {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              if (modelName === 'Domain') {
                return cb(null, null);
              }

              expect(modelName).to.equal('Community');
              return cb(null, {_id: 123});
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {});

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
          uuid: 1
        }
      };
      var res = {
        json: function(code) {
          done(new Error('Should not be called'));
        }
      };
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should send back an error if Community is not found', function(done) {
      var mock = {
        model: function(modelName) {
          return {
            getFromActivityStreamID: function(uuid, cb) {
              return cb(null, null);
            }
          };
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {});

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
  });

  describe('The isValidStream fn', function() {
    it('should send back 400 if req.query.objectType is not set', function(done) {
      var mock = {
        model: function() {
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
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
      var mock = {
        model: function() {
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
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
      var mock = {
        model: function() {
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, callback) {
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
      var mock = {
        model: function() {
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, callback) {
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
      var mock = {
        model: function() {
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, callback) {
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
      var mock = {
        model: function() {
        }
      };
      this.mongoose = mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/activitystreams', {
        getUserStreams: function(user, callback) {
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
