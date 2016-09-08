'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var ObjectId = require('bson').ObjectId;

describe('The authorization middleware', function() {

  var domainModuleMock;

  beforeEach(function() {
    domainModuleMock = {};

    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../core/domain', domainModuleMock);
  });

  describe('The loginAndContinue fn', function() {
    it('does nothing when authenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').loginAndContinue;
      var redirectTarget = null;
      var req = {
        isAuthenticated: function() {
          return true;
        }
      };
      var res = {
        redirect: function(target) {
          redirectTarget = target;
        }
      };
      var next = function() {
        expect(redirectTarget).to.be.null;
        done();
      };
      middleware(req, res, next);
    });

    it('redirects when not authenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').loginAndContinue;
      var req = {
        originalUrl: 'http://localhost/oauth/authorize',
        isAuthenticated: function() {
          return false;
        }
      };
      var res = {
        redirect: function(target) {
          expect(target).to.be.equal('/login?continue=' + encodeURIComponent(req.originalUrl));
          done();
        }
      };
      var next = function() {
      };
      middleware(req, res, next);
    });
  });

  describe('The requiresAPILogin fn', function() {

    it('should send an error if user is not autenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      var res = {
        json: function() {
          done();
        }
      };
      var next = function() {
      };
      middleware(req, res, next);
    });

    it('should call next if user is autenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return true;
        }
      };
      var res = {};
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should call passport if user is not autenticated and bearer strategy is active', function(done) {
      var mock = {
        config: function() {
          return {
            auth: {
              strategies: ['bearer']
            }
          };
        }
      };
      mockery.registerMock('../../core', mock);
      mockery.registerMock('../../core/community', {});

      var passport = {
        authenticate: function() {
          return function() {
            return done();
          };
        }
      };
      mockery.registerMock('passport', passport);

      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      var res = {};
      var next = function() {
        return done(new Error());
      };
      middleware(req, res, next);
    });
  });

  describe('The requiresDomainManager fn', function() {

    var middleware;

    beforeEach(function() {
      mockery.registerMock('../../core/community', {});
      middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresDomainManager;
    });

    it('should return 400 is req.user does not exist', function(done) {
      var req = {
        domain: {
          _id: 123456789
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};

      middleware(req, res, next);
    });

    it('should return 400 if req.domain does not exist', function(done) {
      var req = {
        user: {
          _id: 123456789
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};

      middleware(req, res, next);
    });

    it('should return 400 if req.user._id does not exist', function(done) {
      var req = {
        user: {
        },
        domain: {
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};

      middleware(req, res, next);
    });

    it('should return 403 if req.user is not the domain administrator', function(done) {
      var req = {
        user: {
          _id: 123
        },
        domain: {
          _id: 111,
          administrators: []
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(403);
          done();
        }
      };
      var next = function() {};

      domainModuleMock.userIsDomainAdministrator = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, false);
      };

      middleware(req, res, next);
    });

    it('should call next if req.user is the domain administrator', function(done) {
      var req = {
        user: {
          _id: 123
        },
        domain: {
          _id: 111,
          administrators: []
        }
      };
      var res = {
      };
      var next = done.bind(null, null);

      domainModuleMock.userIsDomainAdministrator = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, true);
      };

      middleware(req, res, next);
    });

  });

  describe('The requiresDomainManager fn', function() {

    var middleware;

    beforeEach(function() {
      mockery.registerMock('../../core/community', {});
      middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresDomainMember;
    });

    it('should send back 400 is there are no user in request', function(done) {
      var req = {
        domain: {}
      };
      var next = function() {};
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      middleware(req, res, next);
    });

    it('should send back 400 is there are no domain in request', function(done) {
      var req = {
        user: {}
      };
      var next = function() {};
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      middleware(req, res, next);
    });

    it('should call next if user is the domain member', function(done) {
      var req = {
        domain: {
          administrators: []
        },
        user: {
          _id: new ObjectId()
        }
      };
      var res = {};
      var next = done;

      domainModuleMock.userIsDomainMember = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, true);
      };

      middleware(req, res, next);
    });

    it('should send back 403 if user is not domain member', function(done) {
      var user_id = new ObjectId();
      var req = {
        domain: {
          administrators: []
        },
        user: {
          _id: user_id
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      var next = function() {};

      domainModuleMock.userIsDomainMember = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, false);
      };

      middleware(req, res, next);
    });

  });

  describe('The requiresCommunityCreator fn', function() {
    it('should send back 400 if user is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresCommunityCreator;
      var req = {
        community: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 if community is not defined in request', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresCommunityCreator;
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

    it('should send back 403 if user is not the community creator', function(done) {
      mockery.registerMock('../../core/community', {});
      var user_id = new ObjectId();
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresCommunityCreator;
      var req = {
        user: {_id: user_id},
        community: {creator: new ObjectId()}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if user is the community creator', function(done) {
      mockery.registerMock('../../core/community', {});
      var user_id = new ObjectId();
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresCommunityCreator;
      var req = {
        user: {_id: user_id},
        community: {creator: user_id}
      };
      middleware(req, {}, done);
    });
  });

});
