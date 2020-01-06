const expect = require('chai').expect;
const mockery = require('mockery');
const ObjectId = require('bson').ObjectId;
const sinon = require('sinon');

describe('The authorization middleware', function() {
  var domainModuleMock;

  beforeEach(function() {
    domainModuleMock = {};

    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../core/platformadmin', {});
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
        expect(redirectTarget).to.equal(null);
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

    it('supports JWT in query string', function(done) {
      mockery.registerMock('passport', {
        authenticate: (name, options) => {
          expect(name).to.equal('jwt');
          expect(options).to.deep.equal({ failureRedirect: '/login?continue=http%3A%2F%2Flocalhost%2Foauth%2Fauthorize' });

          done();
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').loginAndContinue;
      var req = {
        originalUrl: 'http://localhost/oauth/authorize',
        isAuthenticated: function() {
          return false;
        },
        query: {
          jwt: 'myJWT'
        }
      };

      middleware(req, {});
    });

  });

  describe('The requiresAPILogin fn', function() {

    it('should send an error if user is not autenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      const middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILogin;
      const req = {
        isAuthenticated: function() {
          return false;
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code, data, headers, set) {
          expect(code).to.equal(401);
          expect(data).to.shallowDeepEqual({error: {code: 401}});
          expect(set['Content-Type']).to.equal('application/json; charset=utf-8');
          done();
        }
      );
      const next = function() {};

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

    it('should call passport if user is not autenticated and there are auth strategies enabled', function() {
      const strategies = ['bearer'];
      const middlewareSpy = sinon.spy();
      const authSpy = sinon.spy(function() {
        return middlewareSpy;
      });
      const mock = {
        config: function() {
          return {
            auth: {
              apiStrategies: strategies
            }
          };
        }
      };
      const passport = {
        authenticate: authSpy
      };

      mockery.registerMock('../../core', mock);
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('passport', passport);

      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      const res = {};
      const next = sinon.spy();

      middleware(req, res, next);

      expect(next).to.not.have.been.called;
      expect(authSpy).to.have.been.calledWith(strategies, {
        session: false,
        failWithError: false
      });
      expect(middlewareSpy).to.have.been.calledWith(req, res, next);
    });
  });

  describe('The requiresAPILoginAndFailWithError function', function() {
    it('should send an error if user is not autenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      const middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILoginAndFailWithError;
      const req = {
        isAuthenticated: function() {
          return false;
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code, data, headers, set) {
          expect(code).to.equal(401);
          expect(data).to.shallowDeepEqual({error: {code: 401}});
          expect(set['Content-Type']).to.equal('application/json; charset=utf-8');
          done();
        }
      );
      const next = function() {};

      middleware(req, res, next);
    });

    it('should call next if user is autenticated', function(done) {
      mockery.registerMock('../../core/community', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILoginAndFailWithError;
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

    it('should call passport if user is not autenticated and there are auth strategies enabled', function() {
      const strategies = ['bearer'];
      const middlewareSpy = sinon.spy();
      const authSpy = sinon.spy(function() {
        return middlewareSpy;
      });
      const mock = {
        config: function() {
          return {
            auth: {
              apiStrategies: strategies
            }
          };
        }
      };
      const passport = {
        authenticate: authSpy
      };

      mockery.registerMock('../../core', mock);
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('passport', passport);

      var middleware = this.helpers.requireBackend('webserver/middleware/authorization').requiresAPILoginAndFailWithError;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      const res = {};
      const next = sinon.spy();

      middleware(req, res, next);

      expect(next).to.not.have.been.called;
      expect(authSpy).to.have.been.calledWith(strategies, {
        session: false,
        failWithError: true
      });
      expect(middlewareSpy).to.have.been.calledWith(req, res, next);
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
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(400);
          done();
        }
      );
      var next = function() {};

      middleware(req, res, next);
    });

    it('should return 400 if req.domain does not exist', function(done) {
      var req = {
        user: {
          _id: 123456789
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(400);
          done();
        }
      );
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
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(400);
          done();
        }
      );
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
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(403);
          done();
        }
      );
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
      var res = {};
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
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware(req, res, next);
    });

    it('should send back 400 is there are no domain in request', function(done) {
      var req = {
        user: {}
      };
      var next = function() {};
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

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
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          done();
        }
      );
      var next = function() {};

      domainModuleMock.userIsDomainMember = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, false);
      };

      middleware(req, res, next);
    });
  });

  describe('The requirePlatformAdminOrDomainAdmin fn', function() {
    let middleware;
    const platformAdminModule = {};

    beforeEach(function() {
      mockery.registerMock('../../core/community', {});
      mockery.registerMock('../../core/platformadmin', platformAdminModule);
      middleware = this.helpers.requireBackend('webserver/middleware/authorization').requirePlatformAdminOrDomainAdmin;
    });

    it('should call #next() if req.user is a domain administrator', function(done) {
      const req = {
        user: {
          _id: 123
        },
        domain: {
          _id: 111,
          administrators: []
        }
      };
      const res = {};
      const next = done.bind(null, null);

      platformAdminModule.isPlatformAdmin = function() {
        return Promise.resolve(false);
      };

      domainModuleMock.userIsDomainAdministrator = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, true);
      };

      middleware(req, res, next);
    });

    it('should call #next() if req.user is a platform admin', function(done) {
      const req = {
        user: {
          id: 123
        }
      };
      const res = {};
      const next = done.bind(null, null);

      platformAdminModule.isPlatformAdmin = sinon.stub().returns(Promise.resolve(true));
      domainModuleMock.userIsDomainAdministrator = sinon.spy();

      middleware(req, res, next);

      expect(platformAdminModule.isPlatformAdmin).to.have.been.calledOnce;
      expect(platformAdminModule.isPlatformAdmin).to.have.been.calledWith(req.user.id);
      expect(domainModuleMock.userIsDomainAdministrator).to.not.have.been.called;
    });

    it('should return 403 when req.user is not a platform admin nor a domain admin', function(done) {
      const req = {
        user: {
          _id: 123
        },
        domain: {
          _id: 111,
          administrators: []
        }
      };

      const next = done.bind(null, null);

      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(platformAdminModule.isPlatformAdmin).to.have.been.calledOnce;
          expect(platformAdminModule.isPlatformAdmin).to.have.been.calledWith(req.user.id);
          expect(code).to.equal(403);
          done();
        }
      );

      platformAdminModule.isPlatformAdmin = sinon.stub().returns(Promise.resolve(false));

      domainModuleMock.userIsDomainAdministrator = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(null, false);
      };

      middleware(req, res, next);
    });

    it('should return 500 when error occurs while checking domain administrator role of a user', function(done) {
      const req = {
        user: {
          _id: 123
        },
        domain: {
          _id: 111,
          administrators: []
        }
      };

      const next = done.bind(null, null);
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(platformAdminModule.isPlatformAdmin).to.have.been.calledWith(req.user.id);
          expect(code).to.equal(500);
          done();
        }
      );

      platformAdminModule.isPlatformAdmin = sinon.stub().returns(Promise.resolve(false));

      domainModuleMock.userIsDomainAdministrator = function(user, domain, callback) {
        expect(user).to.deep.equal(req.user);
        expect(domain).to.deep.equal(req.domain);
        callback(new Error('something wrong'), null);
      };

      middleware(req, res, next);
    });

    it('should return 500 when error occurs while checking platform admin role of a user', function(done) {
      const req = {
        user: {
          _id: 123
        },
        domain: {
          _id: 111,
          administrators: []
        }
      };

      const next = done.bind(null, null);
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(platformAdminModule.isPlatformAdmin).to.have.been.calledWith(req.user.id);
          expect(domainModuleMock.userIsDomainAdministrator).to.not.have.been.called;
          expect(code).to.equal(500);
          done();
        }
      );

      platformAdminModule.isPlatformAdmin = sinon.stub().returns(Promise.reject(new Error('something wrong')));
      domainModuleMock.userIsDomainAdministrator = sinon.spy();

      middleware(req, res, next);
    });
  });
});
