'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('load() method', function() {
  var collaborationMW;

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration', {});
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
  });

  it('should send back 500 if collaboration module sends back error on load', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback(new Error());
        }
      },
      params: {
        id: 123
      }
    };

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
      lib: {
        queryOne: function(id, callback) {
          return callback();
        }
      },
      params: {
        id: 123
      }
    };

    collaborationMW.load(req, res);
  });

  it('should set req.collaboration when collaboration can be found', function(done) {
    var collaboration = [{_id: 123}];

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback(null, collaboration);
        },
        isMember: function(collaboration, user, callback) {
          return callback(null, true);
        }
      },
      params: {
        id: 123
      },
      user: {
        _id: 1
      }
    };

    collaborationMW.load(req, {}, function(err) {
      expect(err).to.not.exist;
      expect(req.collaboration).to.exist;
      expect(req.collaboration).to.deep.equal(collaboration[0]);
      done();
    });
  });

  it('should send back members array', function(done) {
    var collaboration = [{_id: 123, members: [1, 2, 3]}];

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback(null, collaboration);
        },
        isMember: function(collaboration, user, callback) {
          return callback(null, true);
        }
      },
      params: {
        id: 123
      },
      user: {
        id: 1
      }
    };

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

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration', {});
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').canRead;
  });

  it('should call next if the collaboration type is "open"', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          done(new Error('I should not be called'));
        }
      },
      collaboration: { type: 'open' },
      user: {_id: 'user1'}
    };
    var res = {};
    collaborationMW(req, res, done);
  });

  it('should call next if the collaboration type is "restricted"', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          done(new Error('I should not be called'));
        }
      },
      collaboration: { type: 'restricted' },
      user: {_id: 'user1'}
    };
    var res = {};
    collaborationMW(req, res, done);
  });

  it('should delegate to isMember middleware if the collaboration type is "private"', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          done();
        }
      },
      collaboration: { type: 'private' },
      user: {_id: 'user1'}
    };
    var res = {};
    var err = function() { done(new Error('I should not be called')); };
    collaborationMW(req, res, err);
  });

  it('should delegate to isMember middleware if the collaboration type is "confidential"', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          done();
        }
      },
      collaboration: { type: 'confidential' },
      user: {_id: 'user1'}
    };
    var res = {};
    var err = function() { done(new Error('I should not be called')); };
    collaborationMW(req, res, err);
  });
});

describe('requiresCollaborationMember fn', function() {
  var collaborationMW;

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration', {});
    collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration').requiresCollaborationMember;
  });

  it('should send back 500 when service check fails', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          return callback(new Error());
        }
      },
      collaboration: {},
      user: {}
    };
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };
    collaborationMW(req, res);
  });

  it('should send back 403 when user is not a collaboration member', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          return callback(null, false);
        }
      },
      collaboration: {},
      user: {}
    };
    var res = {
      json: function(code) {
        expect(code).to.equal(403);
        done();
      }
    };
    collaborationMW(req, res);
  });

  it('should call next if user is a collaboration member', function(done) {
    var req = {
      lib: {
        isMember: function(com, user, callback) {
          return callback(null, true);
        }
      },
      collaboration: {},
      user: {}
    };
    var res = {
      json: function() {
        done(new Error());
      }
    };
    collaborationMW(req, res, done);
  });

});
