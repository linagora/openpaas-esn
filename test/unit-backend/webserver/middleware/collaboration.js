'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const ObjectId = require('bson').ObjectId;

describe('The collaboration middleware', function() {
  describe('load() method', function() {
    var collaborationMW;

    it('should send back 500 if collaboration module sends back error on load', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        params: {
          id: 123,
          objectType: 'collaboration'
        }
      };

      mockery.registerMock('../../core/collaboration', {
        queryOne: function(objectType, id, callback) {
          return callback(new Error());
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration');
      collaborationMW.load(req, res, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back 404 if collaboration can not be found', function(done) {

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );

      var req = {
        params: {
          id: 123,
          objectType: 'collaboration'
        }
      };

      mockery.registerMock('../../core/collaboration', {
        queryOne: function(objectType, id, callback) {
          return callback();
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration');
      collaborationMW.load(req, res);
    });

    it('should set req.collaboration when collaboration can be found', function(done) {
      var collaboration = {_id: 123};

      var req = {
        params: {
          id: 123,
          objectType: 'collaboration'
        },
        user: {
          _id: 1
        }
      };

      mockery.registerMock('../../core/collaboration', {
        queryOne: function(objectType, id, callback) {
          return callback(null, collaboration);
        },
        member: {
          isMember: function(collaboration, user, callback) {
            return callback(null, true);
          }
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration');
      collaborationMW.load(req, {}, function(err) {
        expect(err).to.not.exist;
        expect(req.collaboration).to.exist;
        expect(req.collaboration).to.deep.equal(collaboration);
        done();
      });
    });

    it('should send back members array', function(done) {
      var collaboration = {_id: 123, members: [1, 2, 3]};

      var req = {
        params: {
          id: 123,
          objectType: 'collaboration'
        },
        user: {
          id: 1
        }
      };

      mockery.registerMock('../../core/collaboration', {
        queryOne: function(objectType, id, callback) {
          return callback(null, collaboration);
        },
        member: {
          isMember: function(collaboration, user, callback) {
            return callback(null, true);
          }
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration');
      collaborationMW.load(req, {}, function(err) {
        expect(err).to.not.exist;
        expect(req.collaboration).to.exist;
        expect(req.collaboration.members).to.deep.equal([1, 2, 3]);
        done();
      });
    });
  });

  describe('canRead() method', function() {
    var collaborationMW;

    it('should call next if request user is collaboration manager', function(done) {
      const req = {
        isCollaborationManager: true,
        collaboration: { type: 'open' },
        user: {_id: 'user1'}
      };
      const res = {};

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function() {
            done(new Error('I should not be called'));
          }
        },
        CONSTANTS: this.helpers.requireBackend('core/collaboration/constants')
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').canRead;
      collaborationMW(req, res, done);
    });

    it('should call next if the collaboration type is "open"', function(done) {
      var req = {
        collaboration: { type: 'open' },
        user: {_id: 'user1'}
      };
      var res = {};

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function() {
            done(new Error('I should not be called'));
          }
        },
        CONSTANTS: this.helpers.requireBackend('core/collaboration/constants')
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').canRead;
      collaborationMW(req, res, done);
    });

    it('should call next if the collaboration type is "restricted"', function(done) {
      var req = {
        collaboration: { type: 'restricted' },
        user: {_id: 'user1'}
      };

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function() {
            done(new Error('I should not be called'));
          }
        },
        CONSTANTS: this.helpers.requireBackend('core/collaboration/constants')
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').canRead;
      var res = {};
      collaborationMW(req, res, done);
    });

    it('should delegate to isMember middleware if the collaboration type is "private"', function(done) {
      var req = {
        collaboration: { type: 'private' },
        user: {_id: 'user1'}
      };
      var res = {};
      var err = function() { done(new Error('I should not be called')); };

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function() {
            done();
          }
        },
        CONSTANTS: this.helpers.requireBackend('core/collaboration/constants')
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').canRead;
      collaborationMW(req, res, err);
    });

    it('should delegate to isMember middleware if the collaboration type is "confidential"', function(done) {
      var req = {
        collaboration: { type: 'confidential' },
        user: {_id: 'user1'}
      };
      var res = {};
      var err = function() { done(new Error('I should not be called')); };

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function() {
            done();
          }
        },
        CONSTANTS: this.helpers.requireBackend('core/collaboration/constants')
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').canRead;
      collaborationMW(req, res, err);
    });
  });

  describe('requiresCollaborationMember fn', function() {
    var collaborationMW;

    it('should send back 500 when service check fails', function(done) {
      var req = {
        collaboration: {},
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function(com, user, callback) {
            return callback(new Error());
          }
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').requiresCollaborationMember;
      collaborationMW(req, res);
    });

    it('should send back 403 when user is not a collaboration member', function(done) {
      var req = {
        collaboration: {},
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          done();
        }
      );

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function(com, user, callback) {
            return callback(null, false);
          }
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').requiresCollaborationMember;
      collaborationMW(req, res);
    });

    it('should call next if user is a collaboration member', function(done) {
      var req = {
        collaboration: {},
        user: {}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };

      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function(com, user, callback) {
            return callback(null, true);
          }
        }
      });
      collaborationMW = this.helpers.requireBackend('webserver/middleware/collaboration').requiresCollaborationMember;
      collaborationMW(req, res, done);
    });

  });

  describe('the checkUserParamIsNotMember fn', function() {

    it('should send back 400 when req.collaboration is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
      var req = {
        param: function() {
          return '123';
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.param(user_id) is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
      var req = {
        collaboration: {},
        params: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when service check fails', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function(com, user, callback) {
            return callback(new Error());
          }
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
      var req = {
        collaboration: {},
        params: {
          user_id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when user is already a collaboration member', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function(com, user, callback) {
            return callback(null, true);
          }
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
      var req = {
        collaboration: {},
        params: {
          user_id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user is not a collaboration member', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          isMember: function(com, user, callback) {
            return callback(null, false);
          }
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
      var req = {
        collaboration: {},
        params: {
          user_id: '123'
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

  describe('flagCollaborationManager() method', function() {

    it('should send back 400 when req.collaboration is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
      var req = {
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
      var req = {
        collaboration: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 500 when collaboration.isManager() failed', function(done) {
      mockery.registerMock('../../core/collaboration', {
        getLib: () => {},
        member: {
          isManager: (objectType, collaboration, user, callback) => callback(new Error('Fail'))
        }
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
      const req = {
        collaboration: {},
        user: {},
        params: {
          objectType: 'collaboration'
        }
      };
      const res = this.helpers.express.jsonResponse(code => {
        expect(code).to.equal(500);
        done();
      });

      middleware(req, res);
    });

    it('should call next with req.isCollaborationManager initialized', function(done) {
      mockery.registerMock('../../core/collaboration', {
        getLib: () => {},
        member: {
          isManager: (objectType, collaboration, user, callback) => callback(null, true)
        }
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
      const req = {
        collaboration: {},
        user: {},
        params: {
          objectType: 'collaboration'
        }
      };
      const res = {
        json: function() {
          done(new Error());
        }
      };
      const next = () => {
        expect(req.isCollaborationManager).to.be.true;
        done();
      };

      middleware(req, res, next);
    });
  });

  describe('the ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser fn', function() {

    it('should call next if req.isCollaborationManager is true', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        param: function() {
          return '' + id;
        },
        isCollaborationManager: true
      };
      var res = this.helpers.express.jsonResponse(
        function() {
          done(new Error('Should not called res.json()'));
        }
      );

      middleware(req, res, done);
    });

    it('should call checkUserIdParameterIsCurrentUser if req.isCollaborationManager is false', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration');
      var req = {
        param: function() {
          return '' + id;
        },
        isCollaborationManager: false
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      var next = function() {
        done(new Error('Should not called next'));
      };
      middleware.ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser(req, res, next);
    });
  });

  describe('the checkUserIdParameterIsCurrentUser fn', function() {

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
      var req = {
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.param(user_id) is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
      var req = {
        user: {},
        params: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 403 when user._id is not equal to the user_id parameter', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        params: {
          user_id: new ObjectId()
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user._id is equal to the user_id parameter', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        params: {
          user_id: '' + id
        }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
          done(new Error());
        }
      );
      middleware(req, res, done);
    });
  });

  describe('the canLeave fn', function() {

    function checkResponse(status, json, done) {
      return function(_status) {
        expect(_status).to.equal(status);
        return {
          json: function(_json) {
            expect(_json).to.deep.equal(json);
            done();
          }
        };
      };
    }

    beforeEach(function() {
      this.helpers.mock.models({
        Community: {}
      });
    });

    it('should send back 400 when req.collaboration is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      var req = {
        user: {_id: 'aa'},
        params: {
          user_id: 'bb'
        }
      };
      var res = {
        status: checkResponse(400, {
          error: 400,
          message: 'Bad Request',
          details: 'Missing collaboration'
        }, done)
      };
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      var req = {
        collaboration: {},
        params: {
          user_id: {}
        }
      };
      var res = {
        status: checkResponse(400, {
          error: 400,
          message: 'Bad Request',
          details: 'Missing user'
        }, done)
      };
      middleware(req, res);
    });

    it('should send back 400 when req.params.user_id is not defined', function(done) {
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      var req = {
        user: {},
        collaboration: {}
      };
      var res = {
        status: checkResponse(400, {
          error: 400,
          message: 'Bad Request',
          details: 'User_id is missing'
        }, done)
      };
      middleware(req, res);
    });

    it('should send back 403 when user is the collaboration creator', function(done) {
      const id = new ObjectId();
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      const req = {
        isCollaborationManager: true,
        collaboration: {creator: id},
        user: {_id: id},
        params: {
          user_id: id
        }
      };
      const res = {
        status: checkResponse(403, {
          error: 403,
          message: 'Forbidden',
          details: 'User can not leave the collaboration'
        }, done)
      };

      middleware(req, res);
    });

    it('should send back 403 if a current user (not a creator) wants to remove a user from collaboration', function(done) {
      var ObjectId = require('bson').ObjectId;
      mockery.registerMock('../../core/collaboration', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      var req = {
        collaboration: {creator: new ObjectId()},
        user: {_id: new ObjectId()},
        params: {
          user_id: new ObjectId()
        }
      };
      var res = {
        status: checkResponse(403, {
          error: 403,
          message: 'Forbidden',
          details: 'No permissions to remove another user'
        }, done)
      };
      middleware(req, res, done);
    });

    it('should call next if user can leave collaboration', function(done) {
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      const userId = new ObjectId();
      const req = {
        isCollaborationManager: true,
        collaboration: {creator: new ObjectId()},
        user: {_id: userId},
        params: {
          user_id: userId
        }
      };
      const res = {
        status: () => done(new Error('should call next instead'))
      };

      middleware(req, res, done);
    });

    it('should call next if user is creator and removes a user from a collaboration', function(done) {
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      const creatorId = new ObjectId();
      const req = {
        isCollaborationManager: true,
        collaboration: {creator: creatorId},
        user: {_id: creatorId},
        params: {
          user_id: new ObjectId()
        }
      };
      const res = {
        status: () => done(new Error('should call next instead'))
      };

      middleware(req, res, done);
    });

    it('should send back 500 if core collaboration.permission.canLeave returns error', function(done) {
      mockery.registerMock('../../core/collaboration', {
        permission: {
          canLeave: (collaboration, tuple, callback) => callback('error')
        }
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      const creatorId = new ObjectId();
      const req = {
        isCollaborationManager: true,
        collaboration: {creator: creatorId},
        user: {_id: creatorId},
        params: {
          user_id: new ObjectId()
        }
      };
      const res = this.helpers.express.jsonResponse(
        code => {
          expect(code).to.equal(500);
          done();
        }
      );

      middleware(req, res, () => done('should not be called'));
    });

    it('should send back 403 if core collaboration.permission.canLeave returns false', function(done) {
      mockery.registerMock('../../core/collaboration', {
        permission: {
          canLeave: (collaboration, tuple, callback) => callback(null, false)
        }
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      const creatorId = new ObjectId();
      const req = {
        collaboration: { creator: creatorId },
        user: { _id: creatorId },
        params: {
          user_id: new ObjectId()
        }
      };
      const res = this.helpers.express.jsonResponse(
        code => {
          expect(code).to.equal(403);
          done();
        }
      );

      middleware(req, res, () => done('should not be called'));
    });

    it('should call next if core collaboration.permission.canLeave returns true', function(done) {
      mockery.registerMock('../../core/collaboration', {
        permission: {
          canLeave: (collaboration, tuple, callback) => callback(null, true)
        }
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
      const creatorId = new ObjectId();
      const req = {
        isCollaborationManager: true,
        collaboration: { creator: creatorId },
        user: { _id: creatorId },
        params: {
          user_id: new ObjectId()
        }
      };
      const res = {
        status: () => done(new Error('should call next instead'))
      };

      middleware(req, res, done);
    });
  });
});
