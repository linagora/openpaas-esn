'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The community middleware', function() {

  describe('the canJoin fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canJoin;
      var req = {
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canJoin;
      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 403 when community is !== open', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canJoin;
      var req = {
        community: {type: 'foo'},
        user: {},
        params: {
          user_id: {}
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if user can join community', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canJoin;
      var req = {
        community: {type: 'open'},
        user: {},
        params: {
          user_id: {}
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

  describe('the canLeave fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canLeave;
      var req = {
        user: {},
        params: {
          user_id: {}
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

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canLeave;
      var req = {
        community: {},
        params: {
          user_id: {}
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

    it('should send back 400 when req.params.user_id is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canLeave;
      var req = {
        user: {},
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 403 when user is the community creator', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canLeave;
      var req = {
        community: {creator: id},
        user: {_id: id},
        params: {
          user_id: id
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if user can leave community', function(done) {
      var ObjectId = require('bson').ObjectId;
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canLeave;
      var req = {
        community: {creator: new ObjectId()},
        user: {_id: new ObjectId()},
        params: {
          user_id: new ObjectId()
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

  describe('requiresCommunityMember fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').requiresCommunityMember;
      var req = {
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').requiresCommunityMember;
      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when service check fails', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          return callback(new Error());
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').requiresCommunityMember;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 403 when user is not a community member', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          return callback(null, false);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').requiresCommunityMember;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if user is a community member', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          return callback(null, true);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').requiresCommunityMember;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

  });

  describe('the isCreator fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').isCreator;
      var req = {
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').isCreator;
      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when user is not the community creator', function(done) {
      var ObjectId = require('bson').ObjectId;
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').isCreator;
      var req = {
        community: {creator: new ObjectId()},
        user: {_id: new ObjectId()}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if user is the community creator', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').isCreator;
      var req = {
        community: {creator: id},
        user: {_id: id}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

  });

  describe('the checkUserIdParameterIsCurrentUser fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserIdParameterIsCurrentUser;
      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when req.param(user_id) is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserIdParameterIsCurrentUser;
      var req = {
        user: {},
        param: function() {
          return;
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

    it('should send back 400 when user._id is not equal to the user_id parameter', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        param: function() {
          return '' + new ObjectId();
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

    it('should call next if user._id is equal to the user_id parameter', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        param: function() {
          return '' + id;
        }
      };
      var res = {
        json: function(code) {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });
  });

  describe('the checkUserParamIsNotMember fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserParamIsNotMember;
      var req = {
        param: function() {
          return '123';
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

    it('should send back 400 when req.param(user_id) is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserParamIsNotMember;
      var req = {
        community: {},
        param: function() {
          return null;
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

    it('should send back 400 when service check fails', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          return callback(new Error());
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserParamIsNotMember;
      var req = {
        community: {},
        param: function() {
          return '123';
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

    it('should send back 400 when user is already a community member', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          return callback(null, true);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserParamIsNotMember;
      var req = {
        community: {},
        param: function() {
          return '123';
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

    it('should call next if user is not a community member', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          return callback(null, false);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').checkUserParamIsNotMember;
      var req = {
        community: {},
        param: function() {
          return '123';
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

  describe('canRead() method', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should call next if the community type is "open"', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          done(new Error('I should not be called'));
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canRead;
      var req = {
        community: { type: 'open' },
        user: {_id: 'user1'}
      };
      var res = {};
      middleware(req, res, done);
    });
    it('should call next if the community type is "restricted"', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          done(new Error('I should not be called'));
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canRead;
      var req = {
        community: { type: 'restricted' },
        user: {_id: 'user1'}
      };
      var res = {};
      middleware(req, res, done);
    });
    it('should delegate to isMember middleware if the community type is "private"', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          done();
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canRead;
      var req = {
        community: { type: 'private' },
        user: {_id: 'user1'}
      };
      var res = {};
      var err = function() { done(new Error('I should not be called')); };
      middleware(req, res, err);
    });
    it('should delegate to isMember middleware if the community type is "confidential"', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(com, user, callback) {
          done();
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').canRead;
      var req = {
        community: { type: 'confidential' },
        user: {_id: 'user1'}
      };
      var res = {};
      var err = function() { done(new Error('I should not be called')); };
      middleware(req, res, err);
    });
  });

  describe('flagCommunityManager() method', function() {

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').flagCommunityManager;
      var req = {
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').flagCommunityManager;
      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 500 when community.isManager() failed', function(done) {
      mockery.registerMock('../../core/community', {
        isManager: function(community, user, callback) {
          return callback(new Error('Fail'));
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').flagCommunityManager;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next with req.isCommunityManager initialized', function(done) {
      mockery.registerMock('../../core/community', {
        isManager: function(community, user, callback) {
          return callback(null, true);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').flagCommunityManager;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      var next = function() {
        expect(req.isCommunityManager).to.be.true;
        done();
      };
      middleware(req, res, next);
    });
  });

  describe('The filterWritableTargets fn', function() {

    it('should call next if targets is not set', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(new Error());
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').filterWritableTargets;
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
      middleware(req, res, done);
    });

    it('should send back 400 if targets is empty', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(new Error());
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/community').filterWritableTargets;
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
      middleware(req, res, done);
    });

    it('should send back 400 if targets is undefined', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(new Error());
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').filterWritableTargets;
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
      middleware(req, res, done);
    });

    it('should not filter valid and writable targets', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, {_id: uuid});
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/community').filterWritableTargets;
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
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            if (uuid === '1') {
              return cb(null, {_id: uuid});
            } else {
              return cb();
            }
          }
        }
      });

      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').filterWritableTargets;
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
        expect(req.message_targets).to.exist;
        expect(req.message_targets.length).to.equal(1);
        expect(req.message_targets[0].id).to.equal('1');
        done();
      };
      middleware(req, res, next);
    });

    it('should filter unwritable targets', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, {_id: uuid});
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, community._id > 10);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').filterWritableTargets;
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
          done(new Error());
        }
      };
      var next = function() {
        expect(req.message_targets).to.exist;
        expect(req.message_targets.length).to.equal(2);
        done();
      };
      middleware(req, res, next);
    });

    it('should send back 403 if no valid streams are set', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            if (uuid === '1') {
              return cb(null, {_id: uuid});
            } else {
              return cb();
            }
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, false);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/community').filterWritableTargets;
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
          return done();
        }
      };
      middleware(req, res, done);
    });

    it('should be passthrough if inReplyTo is in the body', function(done) {
      this.helpers.mock.models({
        Community: {
        }
      });
      mockery.registerMock('../../core/activitystreams', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').filterWritableTargets;
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

    it('should call next with error Communtity.getFromActivityStreamID send back error', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(new Error());
          }
        },
        Domain: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });

      mockery.registerMock('../../core/activitystreams', {});

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
          uuid: 1
        }
      };
      var res = {
        json: function(code) {
          done(new Error());
        }
      };
      var next = function(err) {
        expect(err).to.exist;
        done();
      };
      middleware(req, res, next);
    });

    it('should call next when stream resource is found (Community)', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, {_id: 123});
          }
        },
        Domain: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').findStreamResource;
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

    it('should call next if Community is not found', function(done) {
      this.helpers.mock.models({
        Community: {
          getFromActivityStreamID: function(uuid, cb) {
            return cb(null, null);
          }
        }
      });
      mockery.registerMock('../../core/activitystreams', {});

      var middleware = this.helpers.requireBackend('webserver/middleware/activitystream').findStreamResource;
      var req = {
        params: {
          uuid: 1
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      var next = function(err) {
        expect(err).to.not.exist;
        done();
      };
      middleware(req, res, next);
    });
  });
});
