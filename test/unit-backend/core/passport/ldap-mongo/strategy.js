'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('The ldap-mongo passport strategy', function() {
  var Strategy = null;

  beforeEach(function() {
    var mockgoose = {
      model: function() {
      }
    };
    mockery.registerMock('mongoose', mockgoose);
    mockery.registerMock('./login', {});
  });

  describe('The authenticate method', function() {

    it('should fail if username and password are not set', function(done) {
      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should fail if username is not set', function(done) {
      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
          password: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should fail if password is not set', function(done) {
      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
          username: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should call passport#fail when user is not found in any LDAP', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback();
        },
        authenticate: function(email, password, ldap, callback) {
          var user = {};
          return callback(null, user);
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should call passport#fail when LDAP search send back an error', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should call passport#error when LDAP authenticate send back an error', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{configuration: {}}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.error = function() {
        done();
      };

      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should call passport#fail when LDAP authenticate send back an auth error', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          var err = new Error();
          err.name = 'InvalidCredentialsError';
          return callback(err);
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should call passport#fail when LDAP authenticate does not return valid user information', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s.fail = function() {
        done();
      };

      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };
      var options = {
      };
      s.authenticate(req, options);
    });

    it('should call passport#success with LDAP payload when the user is authenticated successfully (no verify)', function() {
      var domainId = 'domain1';
      var ldapUser = { _id: '1' };
      var ldapConfig = {
        domainId: domainId,
        configuration: { key: 'value' }
      };
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [ldapConfig]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, ldapUser);
        }
      };

      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');

      var strategy = new Strategy({});
      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };

      strategy.success = sinon.spy();

      strategy.authenticate(req);

      expect(strategy.success).to.have.been.calledOnce;
      expect(strategy.success).to.have.been.calledWith({
        username: req.body.username,
        user: ldapUser,
        config: ldapConfig.configuration,
        domainId: domainId
      });
    });

    it('should call verify fn with LDAP payload when the user is authenticated successfully', function() {
      var domainId = 'domain1';
      var ldapUser = { _id: '1' };
      var ldapConfig = {
        domainId: domainId,
        configuration: { key: 'value' }
      };
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [ldapConfig]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, ldapUser);
        }
      };

      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');

      var verifyFn = sinon.spy();
      var strategy = new Strategy({}, verifyFn);
      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };

      strategy.authenticate(req);

      expect(verifyFn).to.have.been.calledOnce;
      expect(verifyFn).to.have.been.calledWith({
        username: req.body.username,
        user: ldapUser,
        config: ldapConfig.configuration,
        domainId: domainId
      }, sinon.match.func);
    });

    it('should call pass req to verify fn with LDAP payload when the user is authenticated successfully and options.passReqToCallback is true', function() {
      var domainId = 'domain1';
      var ldapUser = { _id: '1' };
      var ldapConfig = {
        domainId: domainId,
        configuration: { key: 'value' }
      };
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [ldapConfig]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, ldapUser);
        }
      };

      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');

      var verifyFn = sinon.spy();
      var strategy = new Strategy({ passReqToCallback: true }, verifyFn);
      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };

      strategy.authenticate(req);

      expect(verifyFn).to.have.been.calledOnce;
      expect(verifyFn).to.have.been.calledWith(req, {
        username: req.body.username,
        user: ldapUser,
        config: ldapConfig.configuration,
        domainId: domainId
      }, sinon.match.func);
    });

    it('should call passport#error when verify fn has error', function() {
      var domainId = 'domain1';
      var ldapUser = { _id: '1' };
      var ldapConfig = {
        domainId: domainId,
        configuration: { key: 'value' }
      };
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [ldapConfig]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, ldapUser);
        }
      };

      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');

      var error = new Error('some_error');
      var verifyFn = function(payload, callback) {
        callback(error);
      };
      var strategy = new Strategy({}, verifyFn);
      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };

      strategy.error = sinon.spy();

      strategy.authenticate(req);

      expect(strategy.error).to.have.been.calledWith(error);
    });

    it('should call passport#success when verify fn succeeds', function() {
      var domainId = 'domain1';
      var ldapUser = { _id: '1' };
      var ldapConfig = {
        domainId: domainId,
        configuration: { key: 'value' }
      };
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [ldapConfig]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, ldapUser);
        }
      };

      mockery.registerMock('../../ldap', ldapmock);

      Strategy = this.helpers.requireBackend('core/passport/ldap-mongo/strategy');

      var verifyFn = function(payload, callback) {
        callback(null, ldapUser);
      };
      var strategy = new Strategy({}, verifyFn);
      var req = {
        body: {
          username: 'foo@bar.com',
          password: 'baz'
        }
      };

      strategy.success = sinon.spy();

      strategy.authenticate(req);

      expect(strategy.success).to.have.been.calledWith(ldapUser);
    });

  });

});
