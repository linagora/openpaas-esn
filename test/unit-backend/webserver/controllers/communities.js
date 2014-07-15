'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The communities controller', function() {

  describe('The create fn', function() {
    it('should send back 400 if community title is not defined', function(done) {
      mockery.registerMock('../../core/community', {});
      var req = {
        body: {}
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
          title: 'Node.js'
        }
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
          title: 'Node.js'
        }
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

  describe('The uploadImage fn', function() {
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
      communities.uploadImage(req, res);
    });
  });

  describe('The getImage fn', function() {
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
      communities.getImage(req, res);
    });

    it('should return 404 if community.image is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      var req = {
        community: {
        }
      };
      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var communities = require(this.testEnv.basePath + '/backend/webserver/controllers/communities');
      communities.getImage(req, res);
    });
  });
});
