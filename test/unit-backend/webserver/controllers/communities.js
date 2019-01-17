'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('The communities controller', function() {
  var Community;

  beforeEach(function() {
    Community = {
      testTitleDomain: sinon.spy(function(title, domains, callback) {
        return callback(null, false);
      })
    };
    this.helpers.mock.models({
      User: function() {},
      Community: Community
    });
  });

  describe('The create fn', function() {
    it('should send back 400 if community title is not defined', function(done) {
      var req = {
        body: {},
        user: {_id: 123}
      };

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should send back 400 if request does not contains domain', function(done) {
      var req = {
        body: {
          title: 'YOLO'
        },
        user: {_id: 123}
      };

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should send back 500 if community module sends back error on save', function(done) {
      var mock = {
        save: function(community, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        body: {
          title: 'Node.js',
          domain_ids: ['123']
        },
        user: {_id: 123},
        domain: {},
        query: {}
      };

      var res = {
        status: function(code) {
          expect(Community.testTitleDomain).to.have.been.called;
          expect(code).to.equal(500);
          return this;
        },
        json: function() {
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should send back 201 if community module does not send back error on save', function(done) {
      var saved = {_id: 123};
      var mock = {
        save: function(community, callback) {
          return callback(null, saved);
        },
        member: {
          isMember: function(community, user, callback) {
            return callback(null, true);
          },
          getMembershipRequest: function() {
            return false;
          }
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        body: {
          title: 'Node.js',
          domain_ids: [123]
        },
        user: {
          _id: 123
        },
        domain: {},
        query: {}
      };

      var res = {
        status: function(code) {
          expect(Community.testTitleDomain).to.have.been.called;
          expect(code).to.equal(201);
          return this;
        },
        json: function(data) {
          expect(data).to.deep.equal(saved);
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should not test the title if the noTitleCheck parameter iis true', function(done) {
      var saved = {_id: 123};
      var mock = {
        save: function(community, callback) {
          return callback(null, saved);
        },
        member: {
          isMember: function(community, user, callback) {
            return callback(null, true);
          },
          getMembershipRequest: function() {
            return false;
          }
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        body: {
          title: 'Node.js',
          domain_ids: [123]
        },
        user: {
          _id: 123
        },
        domain: {},
        query: {
          noTitleCheck: true
        }
      };

      var res = {
        status: function(code) {
          expect(Community.testTitleDomain).to.not.have.been.called;
          expect(code).to.equal(201);
          return this;
        },
        json: function(data) {
          expect(data).to.deep.equal(saved);
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.create(req, res);
    });

  });

  describe('The list fn', function() {
    it('should send back 500 if community module sends back error on query', function(done) {
      var mock = {
        query: function(q, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        query: {}
      };

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should send back 200 if community module sends back query result', function(done) {
      var mock = {
        query: function(q, callback) {
          return callback(null, []);
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        query: {}
      };

      var res = this.helpers.express.jsonResponse(
        function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.be.an.array;
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should send back 200 with communities and members_count', function(done) {
      var result = [
        {_id: 1, members: [1, 2]},
        {_id: 2, members: [1, 2, 3]}
      ];
      var mock = {
        query: function(q, callback) {
          return callback(null, result);
        },
        member: {
          isMember: function(community, user, callback) {
            return callback(null, true);
          },
          getMembershipRequest: function() {
            return false;
          }
        },
        permission: {
          canFind: function(community, tuple, callback) {
            return callback(null, true);
          }
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        query: {},
        user: {_id: 1}
      };

      var res = this.helpers.express.jsonResponse(
        function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.be.an.array;
          result.forEach(function(community) {
            expect(community.members).to.not.exist;
            expect(community.members_count).to.be.an.integer;
          });
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should call the community module with domain in query when defined in the request', function(done) {
      var req = {
        domain: {_id: 123},
        query: {}
      };

      var mock = {
        query: function(q) {
          expect(q.domain_ids).to.exist;
          expect(q.domain_ids.length).to.equal(1);
          expect(q.domain_ids[0]).to.equal(req.domain._id);
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);

      var res = {
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should call the community module with title in query when defined in the request', function(done) {
      var fakeTitle = 'fakeTitle';
      var req = {
        query: {
          title: fakeTitle
        }
      };

      var mock = {
        query: function(q) {
          expect(q.title).to.exist;
          expect(q.title.toString()).to.equal('/^' + fakeTitle + '$/i');
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, {});
    });

    it('should call the community module with title in query and escape regexp characters in the query', function(done) {
      var req = {
        query: {
          title: 'fake$Title^'
        }
      };

      var mock = {
        query: function(q) {
          expect(q.title).to.exist;
          expect(q.title.toString().indexOf('\\$') > -1).to.be.true;
          expect(q.title.toString().indexOf('\\^') > -1).to.be.true;
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, {});
    });

    it('should call the community module with creator in query when defined in the request', function(done) {
      var creatorId = '1234';
      var req = {
        query: {
          creator: creatorId
        }
      };

      var mock = {
        query: function(q) {

          expect(q.creator).to.exist;
          expect(q.creator).to.equal(creatorId);
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.list(req, {});
    });
  });

  describe('load() method', function() {
    it('should call next with error if community module sends back error on load', function(done) {

      var mock = {
        load: function(id, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        params: {
          id: 123
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.load(req, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back 404 if community can not be found', function(done) {
      var mock = {
        load: function(id, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../core/community', mock);

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );

      var req = {
        params: {
          id: 123
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.load(req, res);
    });

    it('should set req.community when community can be found', function(done) {
      var community = {_id: 123};
      var mock = {
        load: function(id, callback) {
          return callback(null, community);
        },
        member: {
          isMember: function(community, user, callback) {
            return callback(null, true);
          }
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        params: {
          id: 123
        },
        user: {
          _id: 1
        }
      };
      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.load(req, {}, function(err) {
        expect(err).to.not.exist;
        expect(req.community).to.exist;
        expect(req.community).to.deep.equal(community);
        done();
      });
    });

    it('should send back members array', function(done) {
      var community = {_id: 123, members: [1, 2, 3]};
      var mock = {
        load: function(id, callback) {
          return callback(null, community);
        },
        member: {
          isMember: function(community, user, callback) {
            return callback(null, true);
          }
        }
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        params: {
          id: 123
        },
        user: {
          id: 1
        }
      };
      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.load(req, {}, function(err) {
        expect(err).to.not.exist;
        expect(req.community).to.exist;
        expect(req.community.members).to.deep.equal([1, 2, 3]);
        done();
      });
    });
  });

  describe('get() method', function() {
    it('should send back HTTP 200 with community if defined in request', function(done) {
      var community = {_id: 123, members: [{member: {objectType: 'user', id: 'user1'}}]};
      var user = {_id: 'user1', id: 'user1'};
      mockery.registerMock('../../core/community', {
        member: {
          getMembershipRequest: function() {
          },
          isMember: function(community, tuple, callback) {
            callback(null, true);
          }
        },
        permission: {
          canWrite: function(community, user, callback) {
            callback(null, true);
          },
          canFind: function(com, tuple, callback) {
            expect(com).to.deep.equal(community);
            callback(null, true);
          }
        }
      });

      var req = {
        community: community,
        user: user
      };
      var res = {
        status: function(code) {
          expect(code).to.equal(200);
          return this;
        },
        json: function(result) {
          expect(result).to.deep.equal({ _id: 123, members_count: 1, member_status: 'member', writable: true });
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.get(req, res);
    });

    it('should send back HTTP 403 if community is not readable by the user', function(done) {
      var community = {_id: 123, members: [{id: 'user1'}]};
      var user = {_id: 'user1'};
      mockery.registerMock('../../core/community', {
        permission: {
          canFind: function(com, tuple, callback) {
            expect(com).to.deep.equal(community);
            return callback(null, false);
          }
        }
      });

      var req = {
        community: community,
        user: user
      };
      var res = {
        status: function(code) {
          expect(code).to.equal(403);
          return this;
        },
        json: function() {
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.get(req, res);
    });

    it('should send back HTTP 404 if community is not set in request', function(done) {
      var req = {};
      var res = {
        status: function(code) {
          expect(code).to.equal(404);
          return this;
        },
        json: function() {
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.get(req, res);
    });
  });

  describe('The delete fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});

      var req = {
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.delete(req, res);
    });

    it('should return 500 if community#delete rejects error', function(done) {
      var mock = {
        delete: sinon.stub().returns(Promise.reject(new Error()))
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        community: {},
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );
      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.delete(req, res);
    });

    it('should return 204 if community#delete resolves', function(done) {
      var mock = {
        delete: sinon.stub().returns(Promise.resolve())
      };
      mockery.registerMock('../../core/community', mock);

      var req = {
        community: {},
        user: {}
      };
      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(204);
          done();
        }
      );
      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.delete(req, res);
    });
  });

  describe('The uploadAvatar fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});

      var req = {
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have mimetype', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          size: 1
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have size', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          mimetype: 'image/png'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have a valid mimetype', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'badimagetype'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have a valid size', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          size: 'a',
          mimetype: 'image/png'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 500 if image module sends back error', function(done) {
      var mock = {
        recordAvatar: function(id, mime, options, req, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/image', mock);
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 412 if image module sends back wrong size', function(done) {
      var mock = {
        recordAvatar: function(id, mime, options, req, callback) {
          return callback(null, 2);
        }
      };
      mockery.registerMock('../../core/image', mock);
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(412);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 500 if avatar update fails on community module', function(done) {
      var mock = {
        recordAvatar: function(id, mime, options, req, callback) {
          return callback(null, 1);
        }
      };
      var community = {
        updateAvatar: function(community, uuid, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/image', mock);
      mockery.registerMock('../../core/community', community);

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 200 if avatar update succeeds on community module', function(done) {
      var mock = {
        recordAvatar: function(id, mime, options, req, callback) {
          return callback(null, 1);
        }
      };
      var community = {
        updateAvatar: function(community, uuid, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../core/image', mock);
      mockery.registerMock('../../core/community', community);

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(200);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should set the current user as avatar creator', function(done) {
      var user = {
        _id: 123
      };

      var mock = {
        recordAvatar: function(id, mime, options) {
          expect(options).to.exist;
          expect(options.creator).to.exist;
          expect(options.creator.objectType).to.equal('user');
          expect(options.creator.id).to.equal(user._id);
          return done();
        }
      };
      mockery.registerMock('../../core/image', mock);
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        },
        user: user
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.uploadAvatar(req, {});
    });
  });

  describe('The getAvatar fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});

      var req = {
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should redirect if community.image is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});

      var req = {
        community: {
        }
      };
      var res = {
        redirect: function() {
          done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should redirect if image module fails', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/image', {
        getAvatar: function(id, format, callback) {
          return callback(new Error());
        }
      });
      var req = {
        community: {
          avatar: 123
        },
        query: {
        }
      };
      var res = {
        json: function() {
          return done(new Error());
        },
        redirect: function() {
          return done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should redirect if image module can not return image stream', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/image', {
        getAvatar: function(id, format, callback) {
          return callback();
        }
      });
      var req = {
        community: {
          avatar: 123
        },
        query: {
        }
      };
      var res = {
        json: function() {
          return done(new Error());
        },
        redirect: function() {
          return done();
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should return 304 if image has not changed', function(done) {
      var image = {
        stream: 'test',
        pipe: function() {
          throw new Error();
        }
      };
      var meta = {
        meta: 'data',
        uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
      };

      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/image', {
        getAvatar: function(id, format, callback) {
          return callback(null, meta, image);
        }
      });
      var req = {
        community: {
          avatar: 123
        },
        headers: {
          'if-modified-since': 'Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)'
        },
        query: {
        }
      };
      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(304);
          done();
        }
      );

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should return 200, add to the cache, and the stream of the avatar file if all is ok', function(done) {
      var image = {
        stream: 'test',
        pipe: function(res) {
          expect(res.header['Last-Modified']).to.exist;
          expect(res.code).to.equal(200);
          done();
        }
      };

      var imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null,
            {
              meta: 'data',
              uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
            }, image);
        }
      };
      mockery.registerMock('../../core/image', imageModuleMock);
      mockery.registerMock('../../core/community', {});

      var req = {
        headers: {
          'if-modified-since': 'Thu Apr 17 2013 11:13:15 GMT+0200 (CEST)'
        },
        community: {
          avatar: 123
        },
        query: {
        }
      };
      var res = {
        status: function(code) {
          this.code = code;
        },
        header: function(header, value) {
          this.header[header] = value;
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getAvatar(req, res);
    });
  });

  describe('The loadDomainForCreate fn', function() {
    it('should send back 400 is domain_id is not defined in body', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        body: {
          domain: 123
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.loadDomainForCreate(req, res);
    });
  });

  describe('getMine fn', function() {
    it('should send back 400 is req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send back 500 is community module sends back error', function(done) {
      mockery.registerMock('../../core/community', {
        getUserCommunities: function(q, r, callback) {
          return callback(new Error());
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        user: {_id: 123}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send back 200 with the communities', function(done) {
      var result = [{_id: 1}, {_id: 2}];
      mockery.registerMock('../../core/community', {
        getUserCommunities: function(q, r, callback) {
          return callback(null, result);
        },
        member: {
          isMember: function(c, u, callback) {
            return callback(null, true);
          },
          getMembershipRequest: function() {
            return false;
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(200, json);
          expect(json).to.deep.equal([
            {_id: 1, members_count: 0, member_status: 'member'},
            {_id: 2, members_count: 0, member_status: 'member'}
          ]);

          done();
        }
      );

      var req = {
        user: {_id: 123}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send back 200 with the communities(membershipRequest)', function(done) {
      var result = [{_id: 1}, {_id: 2}];
      mockery.registerMock('../../core/community', {
        getUserCommunities: function(q, r, callback) {
          return callback(null, result);
        },
        member: {
          isMember: function(c, u, callback) {
            return callback(null, true);
          },
          getMembershipRequest: function() {
            return { timestamp: { creation: new Date(1419509532000) } };
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(200, json);
          expect(json).to.be.an('array');
          expect(json).to.have.length(2);
          expect(json[0]).to.have.property('membershipRequest');
          expect(json[0].membershipRequest).to.be.a('number');
          expect(json[0].membershipRequest).to.equal(1419509532000);
          done();
        }
      );

      var req = {
        user: {_id: 123}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send the transformed community model', function(done) {
      var result = [{_id: 1, members: [{_id: 'user1'}, {_id: 'user2'}]}, {_id: 2, members: [{_id: 'user2'}]}];
      mockery.registerMock('../../core/community', {
        getUserCommunities: function(q, r, callback) {
          return callback(null, result);
        },
        member: {
          isMember: function(c, u, callback) {
            return callback(null, true);
          },
          getMembershipRequest: function() {
            return false;
          }
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(200, json);
          expect(json[0].members_count).to.equal(2);
          expect(json[0].member_status).to.equal('member');
          expect(json[1].members_count).to.equal(1);
          expect(json[1].member_status).to.equal('member');
          done();
        }
      );

      var req = {
        user: {_id: 'user2'}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMine(req, res);
    });

  });

  describe('getMembers fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should send back 500 is community.getMembers returns error', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          getMembers: function(com, query, callback) {
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
        community: {},
        query: {}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should send back 200 is community.getMembers returns result', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          getMembers: function(com, query, callback) {
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
        community: {},
        query: {}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should set the header with the members size', function(done) {
      var members = [1, 2, 3];
      mockery.registerMock('../../core/community', {
        member: {
          getMembers: function(com, query, callback) {
            return callback(null, []);
          }
        }
      });

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
        community: {
          members: members
        },
        query: {}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should query user with request query parameters', function(done) {
      var members = [1, 2, 3];
      var limit = 23;
      var offset = 45;
      mockery.registerMock('../../core/community', {
        member: {
          getMembers: function(com, query, callback) {
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
            'X-ESN-Items-Count': members.length
          });

          done();
        }
      );

      var req = {
        community: {
          members: members
        },
        query: {
          offset: offset,
          limit: limit
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembers(req, res);
    });
  });

  describe('getMember fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        params: {
          user_id: 1
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 500 is communityModule.isMember returns error', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          isMember: function(comm, user, callback) {
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
        community: {
          _id: 2
        },
        params: {
          user_id: 1
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 200 is communityModule.isMember returns result', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          isMember: function(comm, user, callback) {
            return callback(null, []);
          }
        }
      });

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(200);
          done();
        }
      );

      var req = {
        community: {
          _id: 2
        },
        params: {
          user_id: 1
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 404 is communityModule.isMember returns nothing', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          isMember: function(comm, user, callback) {
            return callback();
          }
        }
      });

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );

      var req = {
        community: {
          _id: 2
        },
        params: {
          user_id: 1
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMember(req, res);
    });
  });

  describe('The join fn', function() {
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 400 if req.params.user_id is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        user: {},
        community: {}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.join(req, res);
    });

    describe('when current user is community manager', function() {
      it('should send back 400 when current user ID is equals to req.params.user_id', function(done) {
        mockery.registerMock('../../core/community', {});

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/Community Manager can not add himself to a community/);
            done();
          }
        );

        var req = {
          isCommunityManager: true,
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          community: {},
          params: {
            user_id: 123
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 400 when user_id is not a membership request', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            getMembershipRequest: function() {
              return false;
            }
          }
        });

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/User did not request to join community/);
            done();
          }
        );

        var req = {
          isCommunityManager: true,
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          community: {},
          params: {
            user_id: 123
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 500 when the membership request can not be deleted', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            getMembershipRequest: function() {
              return true;
            },
            cleanMembershipRequest: function(community, user, callback) {
              return callback(new Error());
            }
          },
          join: function(community, user, target, actor, callback) {
            return callback();
          }
        });

        var res = this.helpers.express.jsonResponse(
          function(code) {
            expect(code).to.equal(500);
            done();
          }
        );

        var req = {
          isCommunityManager: true,
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          community: {},
          params: {
            user_id: 123
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 500 when join fails', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            getMembershipRequest: function() {
              return true;
            }
          },
          join: function(community, user, target, actor, callback) {
            return callback(new Error());
          }
        });

        var res = this.helpers.express.jsonResponse(
          function(code) {
            expect(code).to.equal(500);
            done();
          }
        );

        var req = {
          isCommunityManager: true,
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          community: {},
          params: {
            user_id: 123
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 204 when join is OK', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            getMembershipRequest: function() {
              return true;
            },
            cleanMembershipRequest: function(community, user, callback) {
              return callback();
            }
          },
          join: function(community, user, target, actor, callback) {
            return callback();
          }
        });

        var res = this.helpers.express.response(
          function(code) {
            expect(code).to.equal(204);
            done();
          }
        );

        var req = {
          isCommunityManager: true,
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          community: {},
          params: {
            user_id: 123
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.join(req, res);
      });
    });

    describe('when user is not a community manager', function() {

      it('should send back 400 when current user ID is not equals to req.params.user_id', function(done) {
        mockery.registerMock('../../core/community', {});

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/Current user is not the target user/);
            done();
          }
        );

        var req = {
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          community: {},
          params: {
            user_id: 123
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.join(req, res);
      });

      describe('when community is not open', function() {
        it('should send back 400 when user did not make a membership request', function(done) {
          var communityModuleMock = {
            member: {
              getMembershipRequest: function() {
                return null;
              }
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = this.helpers.express.jsonResponse(
            function(code, err) {
              expect(code).to.equal(400);
              expect(err.error.details).to.exist;
              done();
            }
          );

          var req = {
            user: {
              _id: {
                equals: function() {
                  return true;
                }
              }
            },
            community: {
              type: 'private'
            },
            params: {
              user_id: 123
            }
          };

          var communities = this.helpers.requireBackend('webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 500 if erasing the membership requests fails', function(done) {
          var userId = 123;
          var communityModuleMock = {
            member: {
              getMembershipRequest: function() {
                return {user: userId, workflow: 'invitation'};
              },
              cleanMembershipRequest: function(community, user, callback) {
                callback(new Error());
              }
            },
            join: function(community, user, target, actor, callback) {
              return callback();
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = this.helpers.express.jsonResponse(
            function(code, err) {
              expect(code).to.equal(500);
              expect(err).to.exist;
              done();
            }
          );

          var req = {
            user: {
              _id: {
                equals: function() {
                  return true;
                }
              }
            },
            community: {
              type: 'private'
            },
            params: {
              user_id: userId
            }
          };

          var communities = this.helpers.requireBackend('webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 500 if adding the user to the community fails', function(done) {
          var userId = 123;
          var communityModuleMock = {
            member: {
              getMembershipRequest: function() {
                return {user: userId, workflow: 'invitation'};
              },
              removeMembershipRequest: function(community, userAuthor, userTarget, workflow, actor, callback) {
                callback(null);
              }
            },
            join: function(community, userAuthor, userTarget, actor, callback) {
              callback(new Error());
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = this.helpers.express.jsonResponse(
            function(code, err) {
              expect(code).to.equal(500);
              expect(err).to.exist;
              done();
            }
          );

          var req = {
            user: {
              _id: {
                equals: function() {
                  return true;
                }
              }
            },
            community: {
              type: 'private'
            },
            params: {
              user_id: userId
            }
          };

          var communities = this.helpers.requireBackend('webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 204 if the user has been added to the community', function(done) {
          var userId = 123;
          var communityModuleMock = {
            member: {
              getMembershipRequest: function() {
                return {user: userId, workflow: 'invitation'};
              },
              cleanMembershipRequest: function(community, user, callback) {
                callback(null);
              }
            },
            join: function(community, userAuthor, userTarget, actor, callback) {
              callback(null);
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = this.helpers.express.response(
            function(code) {
              expect(code).to.equal(204);
              done();
            }
          );

          var req = {
            user: {
              _id: {
                equals: function() {
                  return true;
                }
              }
            },
            community: {
              type: 'private'
            },
            params: {
              user_id: userId
            }
          };

          var communities = this.helpers.requireBackend('webserver/controllers/communities');
          communities.join(req, res);
        });
      });

      describe('when community is open', function() {
        it('should send back 500 if community module fails', function(done) {
          mockery.registerMock('../../core/community', {
            join: function(community, userAuthor, userTarget, actor, cb) {
              return cb(new Error());
            }
          });

          var res = this.helpers.express.jsonResponse(
            function(code) {
              expect(code).to.equal(500);
              done();
            }
          );

          var req = {
            community: {
              type: 'open'
            },
            user: {
              _id: {
                equals: function() {
                  return true;
                }
              }
            },
            params: {
              user_id: {}
            }
          };

          var communities = this.helpers.requireBackend('webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 204 if community module succeed', function(done) {
          mockery.registerMock('../../core/community', {
            join: function(community, userAuthor, userTarget, actor, cb) {
              return cb();
            },
            member: {
              cleanMembershipRequest: function(community, user, cb) {
                return cb(null, community);
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
            community: {
              type: 'open'
            },
            user: {
              _id: {
                equals: function() {
                  return true;
                }
              }
            },
            params: {
              user_id: {}
            }
          };

          var communities = this.helpers.requireBackend('webserver/controllers/communities');
          communities.join(req, res);
        });
      });
    });
  });

  describe('The leave fn', function() {
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 400 if req.params.user_id is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        user: {},
        community: {}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 500 if community module fails', function(done) {
      mockery.registerMock('../../core/community', {
        leave: function(community, user, userTarget, cb) {
          return cb(new Error());
        }
      });

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        community: {},
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 204 if community module succeed', function(done) {
      mockery.registerMock('../../core/community', {
        leave: function(community, user, userTarget, cb) {
          return cb();
        }
      });

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(204);
          done();
        }
      );

      var req = {
        community: {},
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.leave(req, res);
    });
  });

  describe('removeMembershipRequest() method', function() {
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.removeMembershipRequest(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.removeMembershipRequest(req, res);
    });

    it('should send back 400 if the user_id parameter is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
        community: {},
        user: {}
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.removeMembershipRequest(req, res);
    });

    describe('When current user is not community manager', function() {

      it('should send back 403 when req.params.user_id is not the current user id', function(done) {
        mockery.registerMock('../../core/community', {});

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(403);
            expect(err.error.details).to.match(/Current user is not the target user/);
            done();
          }
        );

        var req = {
          community: {_id: '1'},
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          params: {
            user_id: '2'
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send back 500 if communityModule#removeMembershipRequest fails', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            cancelMembershipRequest: function(community, membership, user, onResponse) {
              onResponse(new Error('community module error'));
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
          community: {
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
            user_id: '2'
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send 204 if communityModule#removeMembershipRequest succeeds', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
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
          community: {
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
            user_id: this.helpers.objectIdMock('2')
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });
    });

    describe('when current user is community manager', function() {

      it('should send back 500 when refuseMembershipRequest fails', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            refuseMembershipRequest: function(community, user, foo, callback) {
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
          isCommunityManager: true,
          community: {
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
            user_id: '2'
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send back 204 when removeMembershipRequest is ok', function(done) {
        mockery.registerMock('../../core/community', {
          member: {
            removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
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
          isCommunityManager: true,
          community: {_id: '1'},
          user: {
            _id: {
              equals: function() {
                return false;
              }
            }
          },
          params: {
            user_id: '2'
          }
        };

        var communities = this.helpers.requireBackend('webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });
    });
  });

  describe('The getMembershipRequests fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      var req = {
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should send back 500 is community.getMembershipRequests returns error', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          getMembershipRequests: function(com, query, callback) {
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
        community: {},
        query: {},
        isCommunityManager: true
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should send back 200 is community.getMembershipRequests returns result', function(done) {
      mockery.registerMock('../../core/community', {
        member: {
          getMembershipRequests: function(com, query, callback) {
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
        community: {},
        query: {},
        isCommunityManager: true
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should set the header with the members size', function(done) {
      var requests = [1, 2, 3];
      mockery.registerMock('../../core/community', {
        member: {
          getMembershipRequests: function(com, query, callback) {
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
        community: {
          membershipRequests: requests
        },
        query: {},
        isCommunityManager: true
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should query user with request query parameters', function(done) {
      var requests = [1, 2, 3];
      var limit = 23;
      var offset = 45;
      mockery.registerMock('../../core/community', {
        member: {
          getMembershipRequests: function(com, query, callback) {
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
        isCommunityManager: true,
        community: {
          membershipRequests: requests
        },
        query: {
          offset: offset,
          limit: limit
        }
      };

      var communities = this.helpers.requireBackend('webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });
  });
});
