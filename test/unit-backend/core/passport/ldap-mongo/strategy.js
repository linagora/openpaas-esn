'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var expect = require('chai').expect;
var LocalStrategy = require('passport-local').Strategy;

describe('The ldap-mongo passport strategy', function() {
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
      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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
      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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
      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

    it('should call passport#error when LDAP authentication succeeds but the user query fails', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, { emails: ['a@a.com'] });
        }
      };
      var userMock = {
        findByEmail: (email, cb) => cb(new Error('Fail'))
      };

      mockery.registerMock('../../ldap', ldapmock);
      mockery.registerMock('../../../core/user', userMock);

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

    it('should call passport#error when LDAP authentication succeeds but provisioning fails', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, { emails: ['a@a.com'] });
        }
      };
      var userMock = {
        findByEmail: (email, cb) => cb(null, null),
        provisionUser: sinon.spy((user, cb) => cb(new Error('Fail')))
      };

      mockery.registerMock('../../ldap', ldapmock);
      mockery.registerMock('../../../core/user', userMock);

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

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

    it('should call passport#success when LDAP authentication succeeds and user is succesfully provisioned in DB', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, { emails: ['a@a.com'] });
        },
        translate: (user, ldapPayload) => ldapPayload.user
      };
      var userMock = {
        findByEmail: (email, cb) => cb(null, null),
        provisionUser: sinon.spy((user, cb) => cb(null, user))
      };

      mockery.registerMock('../../ldap', ldapmock);
      mockery.registerMock('../../../core/user', userMock);

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

      s.success = function() {
        expect(userMock.provisionUser).to.have.been.calledWith({ emails: ['a@a.com'] });

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

    it('should call passport#success when LDAP authentication succeeds and user is succesfully updated in DB', function(done) {
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, { emails: ['a@a.com'] });
        },
        translate: (user, ldapPayload) => ldapPayload.user
      };
      var userMock = {
        findByEmail: (email, cb) => cb(null, { emails: ['a@a.com'] }),
        update: sinon.spy((user, cb) => cb(null, user))
      };

      mockery.registerMock('../../ldap', ldapmock);
      mockery.registerMock('../../../core/user', userMock);

      var s = new LocalStrategy(this.helpers.requireBackend('core/passport/ldap-mongo'));

      s.success = function() {
        expect(userMock.update).to.have.been.calledWith({ emails: ['a@a.com'] });

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

  });

});
