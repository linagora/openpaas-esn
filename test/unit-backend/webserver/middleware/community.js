'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The community middleware', function() {

  describe('the canJoin fn', function() {

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canJoin;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canJoin;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canJoin;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canJoin;
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

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canLeave;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canLeave;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canLeave;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canLeave;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').canLeave;
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

  describe('the isMember fn', function() {

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isMember;
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

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isCreator;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isCreator;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isCreator;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').isCreator;
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

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserIdParameterIsCurrentUser;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserIdParameterIsCurrentUser;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserIdParameterIsCurrentUser;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserIdParameterIsCurrentUser;
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

    it('should send back 400 when req.community is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserParamIsNotMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserParamIsNotMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserParamIsNotMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserParamIsNotMember;
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
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/community').checkUserParamIsNotMember;
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


});
