'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The communities controller', function() {

  describe('The create fn', function() {
    it('should send back 400 if community title is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
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

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list({}, res);
    });

    it('should send back 200 if community module sends back query result', function(done) {
      var mock = {
        query: function(q, callback) {
          return callback(null, []);
        }
      };
      mockery.registerMock('../../core/community', mock);

      var res = {
        json: function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.be.an.array;
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list({}, res);
    });

    it('should call the community module with domain in query when defined in the request', function(done) {
      var req = {
        domain: {_id: 123}
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

      var res = {
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.list(req, res);
    });
  });

  describe('The load fn', function() {
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
        }
      };
      mockery.registerMock('../../core/community', mock);
      var req = {
        params: {
          id: 123
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
  });

  describe('The get fn', function() {
    it('should send back HTTP 200 with community if defined in request', function(done) {
      var community = {_id: 123};
      mockery.registerMock('../../core/community', {});
      var req = {
        community: community
      };
      var res = {
        json: function(code, result) {
          expect(code).to.equal(200);
          expect(result).to.deep.equal(community);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.get(req, res);
    });

    it('should send back HTTP 404 if community is not set in request', function(done) {
      mockery.registerMock('../../core/community', {});
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
  });

  describe('The getAvatar fn', function() {
    it('should return 404 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
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

    it('should return 500 if image module fails', function(done) {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/image', {
        getAvatar: function(id, callback) {
          return callback(new Error());
        }
      });
      var req = {
        community: {
          avatar: 123
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
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
      mockery.registerMock('../../core/image', {
        getAvatar: function(id, callback) {
          return callback(null, meta, image);
        }
      });
      var req = {
        community: {
          avatar: 123
        },
        headers: {
          'if-modified-since': 'Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)'
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
        getAvatar: function(defaultAvatar, callback) {
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
        }
      });

      var res = {
        json: function(code, json) {
          expect(code).to.equal(200, json);
          expect(json).to.deep.equal(result);
          done();
        }
      };

      var req = {
        user: {_id: 123}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMine(req, res);
    });
  });

  describe('The getMembers fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

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
        getMembers: function(com, callback) {
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
        community: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });

    it('should send back 200 is community.getMembers returns result', function(done) {
      mockery.registerMock('../../core/community', {
        getMembers: function(com, callback) {
          return callback(null, []);
        }
      });

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };

      var req = {
        community: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getMembers(req, res);
    });
  });

  describe('The getMember fn', function() {
    it('should send back 400 is req.params.user_id is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

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
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 400 is req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 500 is community module fails', function(done) {
      mockery.registerMock('../../core/community', {
        join: function(community, user, cb) {
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
        community: {},
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });

    it('should send back 204 is community module succeed', function(done) {
      mockery.registerMock('../../core/community', {
        join: function(community, user, cb) {
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
        community: {},
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.join(req, res);
    });
  });

  describe('The leave fn', function() {
    it('should send back 400 is req.community is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 400 is req.user is undefined', function(done) {
      mockery.registerMock('../../core/community', {});

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var req = {
        community: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 500 is community module fails', function(done) {
      mockery.registerMock('../../core/community', {
        leave: function(community, user, cb) {
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
        community: {},
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });

    it('should send back 204 is community module succeed', function(done) {
      mockery.registerMock('../../core/community', {
        leave: function(community, user, cb) {
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
        community: {},
        user: {}
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.leave(req, res);
    });
  });

});
