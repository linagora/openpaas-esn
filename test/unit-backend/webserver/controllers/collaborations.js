'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The collaborations controller', function() {
  beforeEach(function() {
    mockery.registerMock('../denormalize/user', {
      denormalize: () => Promise.resolve({})
    });
  });

  describe('getMembers fn', function() {

    beforeEach(function() {
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/user/domain', {});
    });

    it('should send back 500 if collaboration.getMembers returns error', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        params: {
          objectType: 'communty'
        },
        collaboration: {},
        query: function() {}
      };

      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembers: function(com, objectType, query, callback) {
            return callback(new Error());
          }
        }
      });
      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembers(req, res);
    });

    it('should send back 200 is collaboration.getMembers returns result', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(200);
          done();
        }
      );

      var req = {
        params: {
          objectType: 'communty'
        },
        collaboration: {},
        query: function() {}
      };

      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembers: function(com, objectType, query, callback) {
            return callback(null, []);
          }
        }
      });
      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembers(req, res);
    });

    it('should set the header with the members size', function(done) {
      var members = [1, 2, 3];

      var res = this.helpers.express.jsonResponse(
        function(code, data, headers) {
          expect(code).to.equal(200);
          expect(headers).to.deep.equal({
            'X-ESN-Items-Count': members.length
          });

          done();
        }
      );

      var req = {
        params: {
          objectType: 'community'
        },
        collaboration: {
          members: members
        },
        query: function() {}
      };

      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembers: function(com, objectType, query, callback) {
            var members = [
              { id: 1, member: {objectType: 'user' } },
              { id: 2, member: {objectType: 'user' } },
              { id: 3, member: {objectType: 'user' } }
            ];
            members.total_count = members.length;
            return callback(null, members);
          }
        },
        memberDenormalize: {
          denormalize(objectType, member) { return member; }
        }
      });
      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembers(req, res);
    });

    it('should filter by object type', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code, data, headers) {
          expect(code).to.equal(200);
          expect(headers).to.deep.equal({
            'X-ESN-Items-Count': 1
          });

          done();
        }
      );

      var req = {
        params: {
          objectType: 'community'
        },
        collaboration: {
          members: [1, 2]
        },
        query: {
          limit: 1,
          objectTypeFilter: 'user'
        }
      };

      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembers: function(com, objectType, query, callback) {
            var members = [
              { id: 2, member: {objectType: 'user' } }
            ];
            members.total_count = 1;
            return callback(null, members);
          }
        },
        memberDenormalize: {
          denormalize(objectType, member) { return member; }
        }
      });
      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembers(req, res);
    });

    it('should query user with request query parameters', function(done) {
      var members = [1, 2, 3];
      var limit = 23;
      var offset = 45;

      var res = this.helpers.express.jsonResponse(
        function(code, data, headers) {
          expect(code).to.equal(200);
          expect(headers).to.deep.equal({
            'X-ESN-Items-Count': members.length
          });

          done();
        }
      );

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

      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembers: function(com, objectType, query, callback) {
            expect(query).to.exist;
            expect(query.limit).to.equal(limit);
            expect(query.offset).to.equal(offset);

            var members = [
              { id: 1, member: {objectType: 'user' } },
              { id: 2, member: {objectType: 'user' } },
              { id: 3, member: {objectType: 'user' } }
            ];
            members.total_count = members.length;
            return callback(null, members);
          }
        },
        memberDenormalize: {
          denormalize(objectType, member) { return member; }
        }
      });
      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembers(req, res);
    });

  });

  describe('The getMembershipRequests fn', function() {

    beforeEach(function() {
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../helpers/user', {});
      mockery.registerMock('../../core/user/domain', {});
    });

    it('should send back 500 is collaboration.getMembershipRequests returns error', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembershipRequests: function(objectType, com, query, callback) {
            return callback(new Error());
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        collaboration: {},
        query: {},
        isCollaborationManager: true,
        params: {
          objectType: 'community'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembershipRequests(req, res);
    });

    it('should send back 200 is collaboration.getMembershipRequests returns result', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembershipRequests: function(objectType, com, query, callback) {
            return callback(null, []);
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(200);
          done();
        }
      );

      var req = {
        collaboration: {},
        query: {},
        isCollaborationManager: true,
        params: {
          objectType: 'community'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembershipRequests(req, res);
    });

    it('should set the header with the members size', function(done) {
      var requests = [1, 2, 3];
      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembershipRequests: function(objectType, com, query, callback) {
            return callback(null, []);
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, data, headers) {
          expect(code).to.equal(200);
          expect(headers).to.deep.equal({
            'X-ESN-Items-Count': requests.length
          });

          done();
        }
      );

      var req = {
        collaboration: {
          membershipRequests: requests
        },
        query: {},
        isCollaborationManager: true,
        params: {
          objectType: 'community'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembershipRequests(req, res);
    });

    it('should query user with request query parameters', function(done) {
      var requests = [1, 2, 3];
      var limit = 23;
      var offset = 45;
      mockery.registerMock('../../core/collaboration', {
        member: {
          getMembershipRequests: function(objectType, com, query, callback) {
            expect(query).to.exist;
            expect(query.limit).to.equal(limit);
            expect(query.offset).to.equal(offset);

            return callback(null, []);
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, data, headers) {
          expect(code).to.equal(200);
          expect(headers).to.deep.equal({
            'X-ESN-Items-Count': requests.length
          });

          done();
        }
      );

      var req = {
        isCollaborationManager: true,
        collaboration: {
          membershipRequests: requests
        },
        query: {
          offset: offset,
          limit: limit
        },
        params: {
          objectType: 'community'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getMembershipRequests(req, res);
    });
  });

  describe('The leave fn', function() {
    beforeEach(function() {
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../helpers/user', {});
      mockery.registerMock('../../core/user/domain', {});
    });

    it('should send back 500 if collaboration module fails', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          leave: function(objectType, collaboration, user, userTarget, cb) {
            return cb(new Error());
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        collaboration: {},
        user: {},
        params: {
          user_id: {},
          objectType: 'community'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.leave(req, res);
    });

    it('should send back 204 if collaboration module succeed', function(done) {
      mockery.registerMock('../../core/collaboration', {
        member: {
          leave: function(objectType, collaboration, user, userTarget, cb) {
            return cb();
          }
        }
      });

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(204);
          done();
        }
      );

      var req = {
        collaboration: {},
        user: {},
        params: {
          user_id: {},
          objectType: 'community'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.leave(req, res);
    });
  });

  describe('removeMembershipRequest() method', function() {

    beforeEach(function() {
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../helpers/user', {});
      mockery.registerMock('../../core/user/domain', {});
    });

    describe('When current user is not collaboration manager', function() {

      it('should send back 403 when req.params.user_id is not the current user id', function(done) {
        mockery.registerMock('../../core/collaboration', {});

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(403);
            expect(err.error.details).to.match(/Current user is not the target user/);
            done();
          }
        );

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

        var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
        collaborations.removeMembershipRequest(req, res);
      });

      it('should send back 500 if collaborationModule#removeMembershipRequest fails', function(done) {
        mockery.registerMock('../../core/collaboration', {
          member: {
            cancelMembershipRequest: function(objectType, collaboration, membership, user, onResponse) {
              onResponse(new Error('collaboration module error'));
            }
          }
        });

        var res = this.helpers.express.jsonResponse(
          function(code) {
            expect(code).to.equal(500);
            done();
          }
        );

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

        var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
        collaborations.removeMembershipRequest(req, res);
      });

      it('should send 204 if collaborationModule#removeMembershipRequest succeeds', function(done) {
        mockery.registerMock('../../core/collaboration', {
          member: {
            removeMembershipRequest: function(objectType, collaboration, user, target, workflow, actor, callback) {
              callback(null, {});
            }
          }
        });

        var res = this.helpers.express.response(
          function(code) {
            expect(code).to.equal(204);
            done();
          }
        );

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

        var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
        collaborations.removeMembershipRequest(req, res);
      });
    });

    describe('when current user is collaboration manager', function() {

      it('should send back 500 when refuseMembershipRequest fails', function(done) {
        mockery.registerMock('../../core/collaboration', {
          member: {
            refuseMembershipRequest: function(objectType, collaboration, user, foo, callback) {
              return callback(new Error());
            }
          }
        });

        var res = this.helpers.express.jsonResponse(
          function(code) {
            expect(code).to.equal(500);
            done();
          }
        );

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

        var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
        collaborations.removeMembershipRequest(req, res);
      });

      it('should send back 204 when removeMembershipRequest is ok', function(done) {
        mockery.registerMock('../../core/collaboration', {
          member: {
            removeMembershipRequest: function(objectType, collaboration, user, target, workflow, actor, callback) {
              return callback();
            }
          }
        });

        var res = this.helpers.express.response(
          function(code) {
            expect(code).to.equal(204);
            done();
          }
        );

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

        var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
        collaborations.removeMembershipRequest(req, res);
      });
    });
  });

  describe('getWritable fn', function() {

    beforeEach(function() {
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../helpers/user', {});
      mockery.registerMock('../../core/user/domain', {});
    });

    it('should call collaborationModule#getCollaborationsForUser and send back 500 if there is an error', function(done) {
      mockery.registerMock('../../core/collaboration', {
        getCollaborationsForUser: function(userId, opts, callback) {
          return callback(new Error('testError'));
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, err) {
          expect(code).to.equal(500);
          expect(err).to.exist;
          done();
        }
      );

      var req = {
        user: '123'
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getWritable(req, res);
    });

    it('should call collaborationModule#getCollaborationsForUser and send back 200 with empty array if there is no collaboration returned', function(done) {
      mockery.registerMock('../../core/collaboration', {
        getCollaborationsForUser: function(userId, opts, callback) {
          return callback(null, []);
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, results) {
          expect(code).to.equal(200);
          expect(results).to.deep.equal([]);
          done();
        }
      );

      var req = {
        user: '123'
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getWritable(req, res);
    });

    it('should call collaborationModule#getCollaborationsForUser and send back 200 with transformed collaborations', function(done) {
      var testCollaborations = [
        {
          _id: 'collab1'
        },
        {
          _id: 'collab2'
        }
      ];

      mockery.registerMock('../../core/collaboration', {
        getCollaborationsForUser: function(userId, opts, callback) {
          return callback(null, testCollaborations);
        },
        member: {
          getMembershipRequest: function() {
            return null;
          },
          isMember: function(coll, userTuple, callback) {
            return callback(null, true);
          }
        },
        permission: {
          canWrite: function(coll, userTuple, callback) {
            return callback(null, true);
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, results) {
          expect(code).to.equal(200);
          expect(results).to.deep.equal(testCollaborations);
          done();
        }
      );

      var req = {
        user: {
          _id: '123'
        }
      };

      var collaborations = this.helpers.requireBackend('webserver/controllers/collaborations');
      collaborations.getWritable(req, res);
    });

  });
});
