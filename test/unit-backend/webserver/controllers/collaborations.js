'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');


describe('getMembers fn', function() {

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration/index', {});
    mockery.registerMock('../../core/collaboration/permission', {});
    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../helpers/user', {});
    mockery.registerMock('../../core/user/domain', {});
  });

  it('should send back 500 if req.collaboration is undefined', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {};

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should send back 500 if collaboration.getMembers returns error', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {},
      query: function() {}
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        return callback(new Error());
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should send back 200 is collaboration.getMembers returns result', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function() {}
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {},
      query: function() {}
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        return callback(null, []);
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should set the header with the members size', function(done) {
    var members = [1, 2, 3];

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function(name, value) {
        expect(name).to.equal('X-ESN-Items-Count');
        expect(value).to.equal(members.length);
      }
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {
        members: members
      },
      query: function() {}
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        return callback(null, []);
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should query user with request query parameters', function(done) {
    var members = [1, 2, 3];
    var limit = 23;
    var offset = 45;

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function(name, value) {
        expect(name).to.equal('X-ESN-Items-Count');
        expect(value).to.equal(members.length);
      }
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {
        members: members
      },
      query: {
        limit: limit,
        offset: offset
      }
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        expect(query).to.exist;
        expect(query.limit).to.equal(limit);
        expect(query.offset).to.equal(offset);

        return callback(null, []);
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

});

describe('The getMembershipRequests fn', function() {

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration/index', {});
    mockery.registerMock('../../core/collaboration/permission', {});
    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../helpers/user', {});
    mockery.registerMock('../../core/user/domain', {});
  });

  it('should send back 400 is req.collaboration is undefined', function(done) {
    mockery.registerMock('../../core/collaboration/index', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembershipRequests(req, res);
  });

  it('should send back 500 is collaboration.getMembershipRequests returns error', function(done) {
    mockery.registerMock('../../core/collaboration/index', {
      getMembershipRequests: function(objectType, com, query, callback) {
        return callback(new Error());
      }
    });

    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {
      collaboration: {},
      param: function() {},
      isCollaborationManager: true,
      params: {
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembershipRequests(req, res);
  });

  it('should send back 200 is collaboration.getMembershipRequests returns result', function(done) {
    mockery.registerMock('../../core/collaboration/index', {
      getMembershipRequests: function(objectType, com, query, callback) {
        return callback(null, []);
      }
    });

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function() {}
    };

    var req = {
      collaboration: {},
      param: function() {},
      isCollaborationManager: true,
      params: {
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembershipRequests(req, res);
  });

  it('should set the header with the members size', function(done) {
    var requests = [1, 2, 3];
    mockery.registerMock('../../core/collaboration/index', {
      getMembershipRequests: function(objectType, com, query, callback) {
        return callback(null, []);
      }
    });

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function(name, value) {
        expect(name).to.equal('X-ESN-Items-Count');
        expect(value).to.equal(requests.length);
      }
    };

    var req = {
      collaboration: {
        membershipRequests: requests
      },
      param: function() {},
      isCollaborationManager: true,
      params: {
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembershipRequests(req, res);
  });

  it('should query user with request query parameters', function(done) {
    var requests = [1, 2, 3];
    var limit = 23;
    var offset = 45;
    mockery.registerMock('../../core/collaboration/index', {
      getMembershipRequests: function(objectType, com, query, callback) {
        expect(query).to.exist;
        expect(query.limit).to.equal(limit);
        expect(query.offset).to.equal(offset);

        return callback(null, []);
      }
    });

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function(name, value) {
        expect(name).to.equal('X-ESN-Items-Count');
        expect(value).to.equal(requests.length);
      }
    };

    var req = {
      isCollaborationManager: true,
      collaboration: {
        membershipRequests: requests
      },
      param: function(name) {
        if (name === 'limit') {
          return limit;
        }
        if (name === 'offset') {
          return offset;
        }
      },
      params: {
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembershipRequests(req, res);
  });
});

describe('The leave fn', function() {
  beforeEach(function() {
    mockery.registerMock('../../core/collaboration/index', {});
    mockery.registerMock('../../core/collaboration/permission', {});
    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../helpers/user', {});
    mockery.registerMock('../../core/user/domain', {});
  });

  it('should send back 400 if req.collaboration is undefined', function(done) {
    mockery.registerMock('../../core/collaboration', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
      user: {},
      params: {
        user_id: {},
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.leave(req, res);
  });

  it('should send back 400 if req.user is undefined', function(done) {
    mockery.registerMock('../../core/collaboration', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
      collaboration: {},
      params: {
        user_id: {},
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.leave(req, res);
  });

  it('should send back 400 if req.params.user_id is undefined', function(done) {
    mockery.registerMock('../../core/collaboration', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
      user: {},
      collaboration: {},
      params: {
      objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.leave(req, res);
  });

  it('should send back 500 if collaboration module fails', function(done) {
    mockery.registerMock('../../core/collaboration/index', {
      leave: function(objectType, collaboration, user, userTarget, cb) {
        return cb(new Error());
      }
    });

    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {
      collaboration: {},
      user: {},
      params: {
        user_id: {},
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.leave(req, res);
  });

  it('should send back 204 if collaboration module succeed', function(done) {
    mockery.registerMock('../../core/collaboration/index', {
      leave: function(objectType, collaboration, user, userTarget, cb) {
        return cb();
      }
    });

    var res = {
      send: function(code) {
        expect(code).to.equal(204);
        done();
      }
    };

    var req = {
      collaboration: {},
      user: {},
      params: {
        user_id: {},
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.leave(req, res);
  });
});

describe('removeMembershipRequest() method', function() {

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration/index', {});
    mockery.registerMock('../../core/collaboration/permission', {});
    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../helpers/user', {});
    mockery.registerMock('../../core/user/domain', {});
  });

  it('should send back 400 if req.collaboration is undefined', function(done) {
    mockery.registerMock('../../core/collaboration/index', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
      user: {},
      params: {
        user_id: {},
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.removeMembershipRequest(req, res);
  });

  it('should send back 400 if req.user is undefined', function(done) {
    mockery.registerMock('../../core/collaboration/index', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
      collaboration: {},
      params: {
        user_id: {},
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.removeMembershipRequest(req, res);
  });

  it('should send back 400 if the user_id parameter is undefined', function(done) {
    mockery.registerMock('../../core/collaboration/index', {});

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    var req = {
      collaboration: {},
      user: {},
      params: {
        objectType: 'community'
      }
    };

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.removeMembershipRequest(req, res);
  });

  describe('When current user is not collaboration manager', function() {

    it('should send back 403 when req.params.user_id is not the current user id', function(done) {
      mockery.registerMock('../../core/collaboration/index', {});

      var res = {
        json: function(code, err) {
          expect(code).to.equal(403);
          expect(err.error.details).to.match(/Current user is not the target user/);
          done();
        }
      };

      var req = {
        collaboration: {_id: '1'},
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        params: {
          user_id: '2',
          objectType: 'community'
        }
      };

      var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
      collaborations.removeMembershipRequest(req, res);
    });

    it('should send back 500 if collaborationModule#removeMembershipRequest fails', function(done) {
      mockery.registerMock('../../core/collaboration/index', {
        cancelMembershipRequest: function(objectType, collaboration, membership, user, onResponse) {
          onResponse(new Error('collaboration module error'));
        }
      });

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        collaboration: {
          _id: '1',
          membershipRequests: [
            {
              user: {equals: function() {return true;}},
              workflow: 'request'
            }
          ]
        },
        user: {
          _id: {
            equals: function() {
              return true;
            }
          }
        },
        params: {
          user_id: '2',
          objectType: 'community'
        }
      };

      var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
      collaborations.removeMembershipRequest(req, res);
    });

    it('should send 204 if collaborationModule#removeMembershipRequest succeeds', function(done) {
      mockery.registerMock('../../core/collaboration/index', {
        removeMembershipRequest: function(objectType, collaboration, user, target, workflow, actor, callback) {
          callback(null, {});
        }
      });

      var res = {
        send: function(code) {
          expect(code).to.equal(204);
          done();
        }
      };

      var req = {
        collaboration: {
          _id: '1',
          membershipRequests: [
            {user: this.helpers.objectIdMock('anotherUserrequest')}
          ]},
        user: {
          _id: {
            equals: function() {
              return true;
            }
          }
        },
        params: {
          user_id: this.helpers.objectIdMock('2'),
          objectType: 'community'
        }
      };

      var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
      collaborations.removeMembershipRequest(req, res);
    });
  });

  describe('when current user is collaboration manager', function() {

    it('should send back 500 when refuseMembershipRequest fails', function(done) {
      mockery.registerMock('../../core/collaboration/index', {
        refuseMembershipRequest: function(objectType, collaboration, user, foo, callback) {
          return callback(new Error());
        }
      });

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        isCollaborationManager: true,
        collaboration: {
          _id: '1',
          membershipRequests: [
            {
              user: {equals: function() {return true;}},
              workflow: 'request'
            }
          ]
        },
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        params: {
          user_id: '2',
          objectType: 'community'
        }
      };

      var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
      collaborations.removeMembershipRequest(req, res);
    });

    it('should send back 204 when removeMembershipRequest is ok', function(done) {
      mockery.registerMock('../../core/collaboration/index', {
        removeMembershipRequest: function(objectType, collaboration, user, target, workflow, actor, callback) {
          return callback();
        }
      });

      var res = {
        send: function(code) {
          expect(code).to.equal(204);
          done();
        }
      };

      var req = {
        isCollaborationManager: true,
        collaboration: {_id: '1'},
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        params: {
          user_id: '2',
          objectType: 'community'
        }
      };

      var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
      collaborations.removeMembershipRequest(req, res);
    });
  });
});
