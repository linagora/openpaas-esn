'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The communities controller', function() {

  describe('The create fn', function() {
    it('should send back 400 if community title is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});
      var req = {
        body: {},
        user: {_id: 123}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should send back 400 if request does not contains domain', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});
      var req = {
        body: {
          title: 'YOLO'
        },
        user: {_id: 123}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should send back 500 if community module sends back error on save', function(done) {
      var mock = {
        save: function(community, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        body: {
          title: 'Node.js',
          domain_ids: ['123']
        },
        user: {_id: 123},
        domain: {}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.create(req, res);
    });

    it('should send back 201 if community module does not send back error on save', function(done) {
      var saved = {_id: 123};
      var mock = {
        save: function(community, callback) {
          return callback(null, saved);
        },
        isMember: function(community, user, callback) {
          return callback(null, true);
        },
        getMembershipRequest: function() {
          return false;
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        body: {
          title: 'Node.js',
          domain_ids: [123]
        },
        user: {
          _id: 123
        },
        domain: {}
      };

      var res = {
        json: function(code, data) {
          expect(code).to.equal(201);
          expect(data).to.deep.equal(saved);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        param: function() {}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should send back 200 if community module sends back query result', function(done) {
      var mock = {
        query: function(q, callback) {
          return callback(null, []);
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        param: function() {}
      };

      var res = {
        json: function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.be.an.array;
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
        isMember: function(community, user, callback) {
          return callback(null, true);
        },
        getMembershipRequest: function() {
          return false;
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        param: function() {},
        user: {_id: 1}
      };

      var res = {
        json: function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.be.an.array;
          result.forEach(function(community) {
            expect(community.members).to.not.exist;
            expect(community.members_count).to.be.an.integer;
          });
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should call the community module with domain in query when defined in the request', function(done) {
      var req = {
        domain: {_id: 123},
        param: function() {}
      };

      var mock = {
        query: function(q, callback) {
          expect(q.domain_ids).to.exist;
          expect(q.domain_ids.length).to.equal(1);
          expect(q.domain_ids[0]).to.equal(req.domain._id);
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var res = {
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list(req, res);
    });

    it('should call the community module with title in query when defined in the request', function(done) {
      var fakeTitle = 'fakeTitle';
      var req = {
        param: function(paramName) {
          if (paramName === 'title') {
            return fakeTitle;
          }
          return null;
        }
      };

      var mock = {
        query: function(q, callback) {
          expect(q.title).to.exist;
          expect(q.title.toString()).to.equal('/^' + fakeTitle + '$/i');
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list(req, {});
    });

    it('should call the community module with title in query and escape regexp characters in the query', function(done) {
      var req = {
        param: function(paramName) {
          if (paramName === 'title') {
            return 'fake$Title^';
          }
          return null;
        }
      };

      var mock = {
        query: function(q, callback) {
          expect(q.title).to.exist;
          expect(q.title.toString().indexOf('\\$') > -1).to.be.true;
          expect(q.title.toString().indexOf('\\^') > -1).to.be.true;
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list(req, {});
    });

    it('should call the community module with creator in query when defined in the request', function(done) {
      var creatorId = '1234';
      var req = {
        param: function(paramName) {
          if (paramName === 'creator') {
            return creatorId;
          }
          return null;
        }
      };

      var mock = {
        query: function(q, callback) {

          expect(q.creator).to.exist;
          expect(q.creator).to.equal(creatorId);
          done();
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        params: {
          id: 123
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var req = {
        params: {
          id: 123
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.load(req, res);
    });

    it('should set req.community when community can be found', function(done) {
      var community = {_id: 123};
      var mock = {
        load: function(id, callback) {
          return callback(null, community);
        },
        isMember: function(community, user, callback) {
          return callback(null, true);
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        params: {
          id: 123
        },
        user: {
          _id: 1
        }
      };
      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
        isMember: function(community, user, callback) {
          return callback(null, true);
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        params: {
          id: 123
        },
        user: {
          id: 1
        }
      };
      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      var community = {_id: 123, members: [{id: 'user1'}]};
      var user = {_id: 'user1'};
      mockery.registerMock('../../core/community', {
        isMember: function(c, u, callback) {
          return callback(null, true);
        },
        getMembershipRequest: function() {
          return false;
        }
      });
      mockery.registerMock('../../core/community/permission', {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      });

      var req = {
        community: community,
        user: user
      };
      var res = {
        json: function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.deep.equal({ _id: 123, members_count: 1, member_status: 'member', writable: true });
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.get(req, res);
    });

    it('should send back HTTP 404 if community is not set in request', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.get(req, res);
    });
  });

  describe('The delete fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.delete(req, res);
    });

    it('should return 500 if community#delete sends back error', function(done) {
      var mock = {
        delete: function(community, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.delete(req, res);
    });

    it('should return 204 if community#delete does not send back error', function(done) {
      var mock = {
        delete: function(community, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../core/community', mock);
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(204);
          done();
        }
      };
      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.delete(req, res);
    });
  });

  describe('The uploadAvatar fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have mimetype', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have size', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          mimetype: 'image/png'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have a valid mimetype', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'badimagetype'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should return 400 if request does not have a valid size', function(done) {
      mockery.registerMock('../../core/image', {});
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 'a',
          mimetype: 'image/png'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(412);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.uploadAvatar(req, res);
    });

    it('should set the current user as avatar creator', function(done) {
      var user = {
        _id: 123
      };

      var mock = {
        recordAvatar: function(id, mime, options, req, callback) {
          expect(options).to.exist;
          expect(options.creator).to.exist;
          expect(options.creator.objectType).to.equal('user');
          expect(options.creator.id).to.equal(user._id);
          return done();
        }
      };
      mockery.registerMock('../../core/image', mock);
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {},
        query: {
          size: 1,
          mimetype: 'image/png'
        },
        user: user
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.uploadAvatar(req, {});
    });
  });

  describe('The getAvatar fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should redirect if community.image is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        community: {
        }
      };
      var res = {
        redirect: function() {
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should redirect if image module fails', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});
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

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getAvatar(req, res);
    });

    it('should redirect if image module can not return image stream', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});
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

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});
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
      var res = {
        send: function(code) {
          expect(code).to.equal(304);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
      mockery.registerMock('../../core/community/permission', {});

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

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getAvatar(req, res);
    });
  });

  describe('The loadDomainForCreate fn', function() {
    it('should send back 400 is domain_id is not defined in body', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        body: {
          domain: 123
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.loadDomainForCreate(req, res);
    });
  });

  describe('The getMine fn', function() {
    it('should send back 400 is req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send back 500 is community module sends back error', function(done) {
      mockery.registerMock('../../core/community', {
        query: function(q, callback) {
          return callback(new Error());
        }
      });

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      mockery.registerMock('../../core/community/permission', {});

      var req = {
        user: {_id: 123}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send back 200 with the communities', function(done) {
      var result = [{_id: 1}, {_id: 2}];
      mockery.registerMock('../../core/community', {
        query: function(q, callback) {
          return callback(null, result);
        },
        isMember: function(c, u , callback) {
          return callback(null, true);
        },
        getMembershipRequest: function() {
          return false;
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code, json) {
          expect(code).to.equal(200, json);
          expect(json).to.deep.equal([
            {_id: 1, members_count: 0, member_status: 'member'},
            {_id: 2, members_count: 0, member_status: 'member'}
          ]);
          done();
        }
      };

      var req = {
        user: {_id: 123}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send back 200 with the communities(membershipRequest)', function(done) {
      var result = [{_id: 1}, {_id: 2}];
      mockery.registerMock('../../core/community', {
        query: function(q, callback) {
          return callback(null, result);
        },
        isMember: function(c, u , callback) {
          return callback(null, true);
        },
        getMembershipRequest: function() {
          return { timestamp: { creation: new Date(1419509532000) } };
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code, json) {
          expect(code).to.equal(200, json);
          expect(json).to.be.an('array');
          expect(json).to.have.length(2);
          expect(json[0]).to.have.property('membershipRequest');
          expect(json[0].membershipRequest).to.be.a('number');
          expect(json[0].membershipRequest).to.equal(1419509532000);
          done();
        }
      };

      var req = {
        user: {_id: 123}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMine(req, res);
    });

    it('should send the transformed community model', function(done) {
      var result = [{_id: 1, members: [{_id: 'user1'}, {_id: 'user2'}]}, {_id: 2, members: [{_id: 'user2'}]}];
      mockery.registerMock('../../core/community', {
        query: function(q, callback) {
          return callback(null, result);
        },
        isMember: function(c, u , callback) {
          return callback(null, true);
        },
        getMembershipRequest: function() {
          return false;
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code, json) {
          expect(code).to.equal(200, json);
          expect(json[0].members_count).to.equal(2);
          expect(json[0].member_status).to.equal('member');
          expect(json[1].members_count).to.equal(1);
          expect(json[1].member_status).to.equal('member');
          done();
        }
      };

      var req = {
        user: {_id: 'user2'}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMine(req, res);
    });

  });

  describe('The getMembers fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should send back 500 is community.getMembers returns error', function(done) {
      mockery.registerMock('../../core/community', {
        getMembers: function(com, query, callback) {
          return callback(new Error());
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        community: {},
        param: function() {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should send back 200 is community.getMembers returns result', function(done) {
      mockery.registerMock('../../core/community', {
        getMembers: function(com, query, callback) {
          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        },
        header: function() {}
      };

      var req = {
        community: {},
        param: function() {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should set the header with the members size', function(done) {
      var members = [1, 2, 3];
      mockery.registerMock('../../core/community', {
        getMembers: function(com, query, callback) {
          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

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
        community: {
          members: members
        },
        param: function() {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should query user with request query parameters', function(done) {
      var members = [1, 2, 3];
      var limit = 23;
      var offset = 45;
      mockery.registerMock('../../core/community', {
        getMembers: function(com, query, callback) {
          expect(query).to.exist;
          expect(query.limit).to.equal(limit);
          expect(query.offset).to.equal(offset);

          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

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
        community: {
          members: members
        },
        param: function(name) {
          if (name === 'limit') {
            return limit;
          }
          if (name === 'offset') {
            return offset;
          }
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });
  });

  describe('The getMember fn', function() {
    it('should send back 400 is req.params.user_id is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        params: {
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        params: {
          user_id: 1
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 500 is communityModule.isMember returns error', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(comm, user, callback) {
          return callback(new Error());
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        community: {
          _id: 2
        },
        params: {
          user_id: 1
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 200 is communityModule.isMember returns result', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(comm, user, callback) {
          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };

      var req = {
        community: {
          _id: 2
        },
        params: {
          user_id: 1
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMember(req, res);
    });

    it('should send back 404 is communityModule.isMember returns nothing', function(done) {
      mockery.registerMock('../../core/community', {
        isMember: function(comm, user, callback) {
          return callback();
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var req = {
        community: {
          _id: 2
        },
        params: {
          user_id: 1
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMember(req, res);
    });
  });


  describe('The join fn', function() {
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 400 if req.params.user_id is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {},
        community: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });

    describe('when current user is community manager', function() {
      it('should send back 400 when current user ID is equals to req.params.user_id', function(done) {
        mockery.registerMock('../../core/community', {});
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/Community Manager can not add himself to a community/);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 400 when user_id is not a membership request', function(done) {
        mockery.registerMock('../../core/community', {
          getMembershipRequest: function() {
            return false;
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/User did not request to join community/);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 500 when the membership request can not be deleted', function(done) {
        mockery.registerMock('../../core/community', {
          getMembershipRequest: function() {
            return true;
          },
          cleanMembershipRequest: function(community, user, callback) {
            return callback(new Error());
          },
          join: function(community, user, target, actor, callback) {
            return callback();
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, err) {
            expect(code).to.equal(500);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 500 when join fails', function(done) {
        mockery.registerMock('../../core/community', {
          getMembershipRequest: function() {
            return true;
          },
          removeMembershipRequest: function(community, user, target, workflow, type, callback) {
            return callback();
          },
          join: function(community, user, target, actor, callback) {
            return callback(new Error());
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.join(req, res);
      });

      it('should send back 204 when join is OK', function(done) {
        mockery.registerMock('../../core/community', {
          getMembershipRequest: function() {
            return true;
          },
          cleanMembershipRequest: function(community, user, callback) {
            return callback();
          },
          join: function(community, user, target, actor, callback) {
            return callback();
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          send: function(code) {
            expect(code).to.equal(204);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.join(req, res);
      });
    });

    describe('when user is not a community manager', function() {

      it('should send back 400 when current user ID is not equals to req.params.user_id', function(done) {
        mockery.registerMock('../../core/community', {});
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/Current user is not the target user/);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.join(req, res);
      });

      describe('when community is not open', function() {
        it('should send back 400 when user did not make a membership request', function(done) {
          mockery.registerMock('../../core/community/permission', {});
          var communityModuleMock = {
            getMembershipRequest: function() {
              return null;
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = {
            json: function(code, err) {
              expect(code).to.equal(400);
              expect(err.error.details).to.exist;
              done();
            }
          };

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

          var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 500 if erasing the membership requests fails', function(done) {
          var userId = 123;
          mockery.registerMock('../../core/community/permission', {});
          var communityModuleMock = {
            getMembershipRequest: function() {
              return {user: userId, workflow: 'invitation'};
            },
            cleanMembershipRequest: function(community, user, callback) {
              callback(new Error());
            },
            join: function(community, user, target, actor, callback) {
              return callback();
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = {
            json: function(code, err) {
              expect(code).to.equal(500);
              expect(err).to.exist;
              done();
            }
          };

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

          var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 500 if adding the user to the community fails', function(done) {
          var userId = 123;
          mockery.registerMock('../../core/community/permission', {});
          var communityModuleMock = {
            getMembershipRequest: function() {
              return {user: userId, workflow: 'invitation'};
            },
            removeMembershipRequest: function(community, userAuthor, userTarget, workflow, actor, callback) {
              callback(null);
            },
            join: function(community, userAuthor, userTarget, actor, callback) {
              callback(new Error());
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = {
            json: function(code, err) {
              expect(code).to.equal(500);
              expect(err).to.exist;
              done();
            }
          };

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

          var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 204 if the user has been added to the community', function(done) {
          var userId = 123;
          mockery.registerMock('../../core/community/permission', {});
          var communityModuleMock = {
            getMembershipRequest: function() {
              return {user: userId, workflow: 'invitation'};
            },
            cleanMembershipRequest: function(community, user, callback) {
              callback(null);
            },
            join: function(community, userAuthor, userTarget, actor, callback) {
              callback(null);
            }
          };
          mockery.registerMock('../../core/community', communityModuleMock);

          var res = {
            send: function(code) {
              expect(code).to.equal(204);
              done();
            }
          };

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

          var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
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
          mockery.registerMock('../../core/community/permission', {});

          var res = {
            json: function(code) {
              expect(code).to.equal(500);
              done();
            }
          };

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

          var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
          communities.join(req, res);
        });

        it('should send back 204 if community module succeed', function(done) {
          mockery.registerMock('../../core/community', {
            join: function(community, userAuthor, userTarget, actor, cb) {
              return cb();
            }
          });
          mockery.registerMock('../../core/community/permission', {});

          var res = {
            send: function(code) {
              expect(code).to.equal(204);
              done();
            }
          };

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

          var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
          communities.join(req, res);
        });
      });
    });
  });

  describe('The leave fn', function() {
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 400 if req.params.user_id is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {},
        community: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 500 if community module fails', function(done) {
      mockery.registerMock('../../core/community', {
        leave: function(community, user, userTarget, cb) {
          return cb(new Error());
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        community: {},
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 204 if community module succeed', function(done) {
      mockery.registerMock('../../core/community', {
        leave: function(community, user, userTarget, cb) {
          return cb();
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        send: function(code) {
          expect(code).to.equal(204);
          done();
        }
      };

      var req = {
        community: {},
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });
  });

  describe('The addMembershipRequest fn', function() {
    beforeEach(function() {
      this.communityCore = {
        MEMBERSHIP_TYPE_REQUEST: 'request',
        MEMBERSHIP_TYPE_INVITATION: 'invitation'
      };
    });
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', this.communityCore);
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.addMembershipRequest(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', this.communityCore);
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };


      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.addMembershipRequest(req, res);
    });

    it('should send back 400 if the user_id parameter is undefined', function(done) {
      mockery.registerMock('../../core/community', this.communityCore);
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.addMembershipRequest(req, res);
    });

    it('should send back 500 if communityModule#addMembershipRequest fails', function(done) {
      this.communityCore.addMembershipRequest = function(community, userAuthor, userTarget, workflow, actor, callback) {
        expect(community).to.deep.equal(req.community);
        expect(userAuthor).to.deep.equal(req.user);
        expect(userTarget).to.deep.equal(req.params.user_id);
        callback(new Error('community module error'));
      };
      mockery.registerMock('../../core/community', this.communityCore);
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        community: {_id: '1'},
        user: {_id: '2'},
        params: {
          user_id: '2'
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.addMembershipRequest(req, res);
    });

    it('should send back the community modified by communityModule#addMembershipRequest', function(done) {
      var modifiedCommunity = {
        _id: '1',
        membershipRequests: [
          {
            user: this.helpers.objectIdMock('2'),
            timestamp: {
              creation: new Date()
            }
          }
        ]
      };
      this.communityCore.addMembershipRequest = function(community, userAuthor, userTarget, workflow, actor, callback) {
        expect(community).to.deep.equal(req.community);
        expect(userAuthor).to.deep.equal(req.user);
        expect(userTarget).to.deep.equal(req.params.user_id);
        expect(workflow).to.equal('request');
        callback(null, modifiedCommunity);
      };
      this.communityCore.getMembershipRequest = function() {
        return modifiedCommunity.membershipRequests[0];
      };
      this.communityCore.isMember = function(community, user, callback) {
        callback(null, false);
      };
      mockery.registerMock('../../core/community', this.communityCore);
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code, content) {
          expect(code).to.equal(200);
          expect(content).to.deep.equal(modifiedCommunity);
          done();
        }
      };

      var req = {
        community: {
          _id: '1',
          membershipRequests: [{user: this.helpers.objectIdMock('anotherUserrequest')}]},
        user: {_id: this.helpers.objectIdMock('2')},
        params: {
          user_id: this.helpers.objectIdMock('2')
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.addMembershipRequest(req, res);
    });

    describe('when the logged user is a manager', function() {
      it('should send back the community modified by communityModule#addMembershipRequest ' +
        'and the workflow must be "invitation"', function(done) {
        var modifiedCommunity = {
          _id: '1',
          membershipRequests: [
            {
              user: this.helpers.objectIdMock('2'),
              timestamp: {
                creation: new Date()
              }
            }
          ]
        };

        this.communityCore.addMembershipRequest = function(community, userAuthor, userTarget, workflow, actor, callback) {
          expect(community).to.deep.equal(req.community);
          expect(userAuthor).to.deep.equal(req.user);
          expect(userTarget).to.deep.equal(req.params.user_id);
          expect(workflow).to.equal('invitation');
          callback(null, modifiedCommunity);
        };
        this.communityCore.getMembershipRequest = function() {
          return modifiedCommunity.membershipRequests[0];
        };
        this.communityCore.isMember = function(community, user, callback) {
          callback(null, false);
        };

        mockery.registerMock('../../core/community', this.communityCore);
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, content) {
            expect(code).to.equal(200);
            expect(content).to.deep.equal(modifiedCommunity);
            done();
          }
        };

        var req = {
          community: {
            _id: '1',
            membershipRequests: [{user: this.helpers.objectIdMock('anotherUserrequest')}]},
          user: {_id: this.helpers.objectIdMock('2')},
          params: {
            user_id: this.helpers.objectIdMock('2')
          },
          isCommunityManager: true
        };

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.addMembershipRequest(req, res);
      });
    });
  });


  describe('The removeMembershipRequest fn', function() {
    it('should send back 400 if req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.removeMembershipRequest(req, res);
    });

    it('should send back 400 if req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.removeMembershipRequest(req, res);
    });

    it('should send back 400 if the user_id parameter is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {},
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.removeMembershipRequest(req, res);
    });

    describe('When current user is not community manager', function() {

      it('should send back 400 when req.params.user_id is not the current user id', function(done) {
        mockery.registerMock('../../core/community', {});
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/Current user is not the target user/);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send back 500 if communityModule#removeMembershipRequest fails', function(done) {
        mockery.registerMock('../../core/community', {
          removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
            callback(new Error('community module error'));
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };

        var req = {
          community: {_id: '1'},
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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send 204 if communityModule#removeMembershipRequest succeeds', function(done) {
        mockery.registerMock('../../core/community', {
          removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
            callback(null, {});
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          send: function(code) {
            expect(code).to.equal(204);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });
    });

    describe('when current user is community manager', function() {

      it('should send back 400 when req.params.user_id is the current user id', function(done) {
        mockery.registerMock('../../core/community', {});
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.match(/Community Manager can not remove himself from membership request/);
            done();
          }
        };

        var req = {
          isCommunityManager: true,
          community: {_id: '1'},
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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send back 500 when removeMembershipRequest fails', function(done) {
        mockery.registerMock('../../core/community', {
          removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
            return callback(new Error());
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });

      it('should send back 204 when removeMembershipRequest is ok', function(done) {
        mockery.registerMock('../../core/community', {
          removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
            return callback();
          }
        });
        mockery.registerMock('../../core/community/permission', {});

        var res = {
          send: function(code) {
            expect(code).to.equal(204);
            done();
          }
        };

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

        var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
        communities.removeMembershipRequest(req, res);
      });
    });
  });

  describe('The getMembershipRequests fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should send back 500 is community.getMembershipRequests returns error', function(done) {
      mockery.registerMock('../../core/community', {
        getMembershipRequests: function(com, query, callback) {
          return callback(new Error());
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var req = {
        community: {},
        param: function() {},
        isCommunityManager: true
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should send back 200 is community.getMembershipRequests returns result', function(done) {
      mockery.registerMock('../../core/community', {
        getMembershipRequests: function(com, query, callback) {
          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        },
        header: function() {}
      };

      var req = {
        community: {},
        param: function() {},
        isCommunityManager: true
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should set the header with the members size', function(done) {
      var requests = [1, 2, 3];
      mockery.registerMock('../../core/community', {
        getMembershipRequests: function(com, query, callback) {
          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

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
        community: {
          membershipRequests: requests
        },
        param: function() {},
        isCommunityManager: true
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });

    it('should query user with request query parameters', function(done) {
      var requests = [1, 2, 3];
      var limit = 23;
      var offset = 45;
      mockery.registerMock('../../core/community', {
        getMembershipRequests: function(com, query, callback) {
          expect(query).to.exist;
          expect(query.limit).to.equal(limit);
          expect(query.offset).to.equal(offset);

          return callback(null, []);
        }
      });
      mockery.registerMock('../../core/community/permission', {});

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
        isCommunityManager: true,
        community: {
          membershipRequests: requests
        },
        param: function(name) {
          if (name === 'limit') {
            return limit;
          }
          if (name === 'offset') {
            return offset;
          }
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembershipRequests(req, res);
    });
  });
});
