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
        objectType: 'community'
      }
    };

    mockery.registerMock('../../core/collaboration', {
      queryOne: function(objectType, id, callback) {
        return callback(new Error());
      }
    });
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
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
        objectType: 'community'
      }
    };

    mockery.registerMock('../../core/collaboration', {
      queryOne: function(objectType, id, callback) {
        return callback();
      }
    });
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
    collaborationMW.load(req, res);
  });

  it('should set req.collaboration when collaboration can be found', function(done) {
    var collaboration = {_id: 123};

    var req = {
      params: {
        id: 123,
        objectType: 'community'
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
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
        objectType: 'community'
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').canRead;
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').canRead;
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').canRead;
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').canRead;
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').requiresCollaborationMember;
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').requiresCollaborationMember;
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
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').requiresCollaborationMember;
    collaborationMW(req, res, done);
  });

});
