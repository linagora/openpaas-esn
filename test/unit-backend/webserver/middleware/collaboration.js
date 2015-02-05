'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('load() method', function() {
  var collaborationMW;

  it('should send back 500 if collaboration module sends back error on load', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

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

    var res = {
      json: function(code) {
        expect(code).to.equal(404);
        done();
      }
    };

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
      isMember: function(collaboration, user, callback) {
        return callback(null, true);
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
      isMember: function(collaboration, user, callback) {
        return callback(null, true);
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

  it('should call next if the collaboration type is "open"', function(done) {
    var req = {
      collaboration: { type: 'open' },
      user: {_id: 'user1'}
    };
    var res = {};

    mockery.registerMock('../../core/collaboration', {
      isMember: function(com, user, callback) {
        done(new Error('I should not be called'));
      }
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
      isMember: function(com, user, callback) {
        done(new Error('I should not be called'));
      }
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
      isMember: function(com, user, callback) {
        done();
      }
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
      isMember: function(com, user, callback) {
        done();
      }
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
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    mockery.registerMock('../../core/collaboration', {
      isMember: function(com, user, callback) {
        return callback(new Error());
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
    var res = {
      json: function(code) {
        expect(code).to.equal(403);
        done();
      }
    };

    mockery.registerMock('../../core/collaboration', {
      isMember: function(com, user, callback) {
        return callback(null, false);
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
      isMember: function(com, user, callback) {
        return callback(null, true);
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
    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };
    middleware(req, res);
  });

  it('should send back 400 when req.param(user_id) is not defined', function(done) {
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
    var req = {
      collaboration: {},
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
    mockery.registerMock('../../core/collaboration', {
      isMember: function(com, user, callback) {
        return callback(new Error());
      }
    });
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
    var req = {
      collaboration: {},
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

  it('should send back 400 when user is already a collaboration member', function(done) {
    mockery.registerMock('../../core/collaboration', {
      isMember: function(com, user, callback) {
        return callback(null, true);
      }
    });
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
    var req = {
      collaboration: {},
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

  it('should call next if user is not a collaboration member', function(done) {
    mockery.registerMock('../../core/collaboration', {
      isMember: function(com, user, callback) {
        return callback(null, false);
      }
    });
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserParamIsNotMember;
    var req = {
      collaboration: {},
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

describe('flagCollaborationManager() method', function() {

  it('should send back 400 when req.collaboration is not defined', function(done) {
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
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
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
    var req = {
      collaboration: {}
    };
    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };
    middleware(req, res);
  });

  it('should send back 500 when collaboration.isManager() failed', function(done) {
    mockery.registerMock('../../core/collaboration', {
      isManager: function(objectType, collaboration, user, callback) {
        return callback(new Error('Fail'));
      }
    });
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
    var req = {
      collaboration: {},
      user: {},
      params: {
        objectType: 'collaboration'
      }
    };
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };
    middleware(req, res);
  });

  it('should call next with req.isCollaborationManager initialized', function(done) {
    mockery.registerMock('../../core/collaboration', {
      isManager: function(objectType, collaboration, user, callback) {
        return callback(null, true);
      }
    });
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').flagCollaborationManager;
    var req = {
      collaboration: {},
      user: {},
      params: {
        objectType: 'collaboration'
      }
    };
    var res = {
      json: function() {
        done(new Error());
      }
    };
    var next = function() {
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
    var res = {
      json: function(code) {
        done(new Error('Should not called res.json()'));
      }
    };
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
    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };
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
    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };
    middleware(req, res);
  });

  it('should send back 400 when req.param(user_id) is not defined', function(done) {
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
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

  it('should send back 403 when user._id is not equal to the user_id parameter', function(done) {
    var ObjectId = require('bson').ObjectId;
    var id = new ObjectId();

    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
    var req = {
      user: {_id: id},
      param: function() {
        return '' + new ObjectId();
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

  it('should call next if user._id is equal to the user_id parameter', function(done) {
    var ObjectId = require('bson').ObjectId;
    var id = new ObjectId();

    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').checkUserIdParameterIsCurrentUser;
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

describe('the canLeave fn', function() {

  beforeEach(function() {
    this.helpers.mock.models({
      Community: {}
    });
  });

  it('should send back 400 when req.collaboration is not defined', function(done) {
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
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
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
    var req = {
      collaboration: {},
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
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
    var req = {
      user: {},
      collaboration: {}
    };
    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };
    middleware(req, res);
  });

  it('should send back 403 when user is the collaboration creator', function(done) {
    var ObjectId = require('bson').ObjectId;
    var id = new ObjectId();
    mockery.registerMock('../../core/collaboration', {});
    var middleware = this.helpers.requireBackend('webserver/middleware/collaboration').canLeave;
    var req = {
      collaboration: {creator: id},
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

  it('should call next if user can leave collaboration', function(done) {
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
      json: function() {
        done(new Error());
      }
    };
    middleware(req, res, done);
  });
});
