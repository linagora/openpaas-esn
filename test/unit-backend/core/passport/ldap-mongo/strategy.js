'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The ldap-mongo passport strategy', function() {
  var Strategy = null;

  beforeEach(function() {
    var mockgoose = {
      model: function() {
      }
    };
    mockery.registerMock('mongoose', mockgoose);
  });

  describe('handleAuthentication', function() {

    it('should fail if username and password are not set', function(done) {
      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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
      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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
      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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

    it('should provision the user on authenticate if user is not available in storage', function(done) {

      var ldapuser = {
        firstname: 'foo',
        lastname: 'bar',
        mail: 'foo@bar.com',
        mailAlias: 'foo@baz.com',
        userPassword: 'baz'
      };

      var usermodule = {
        findByEmail: function(user, callback) {
          return callback(null, null);
        },
        provisionUser: function(user) {
          expect(user).to.exist;
          expect(user.emails).to.exist;
          expect(user.emails.length).to.equal(2);
          done();
        }
      };
      mockery.registerMock('../../user', usermodule);
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          var ldap = {
            domain: '222222',
            configuration: {
              url: 'ldap://localhost:1389',
              adminDn: 'uid=admin,ou=passport-ldapauth',
              adminPassword: 'secret',
              searchBase: 'ou=passport-ldapauth',
              searchFilter: '(mail={{username}})',
              mapping: {
                firstname: 'firstname',
                lastname: 'lastname',
                email: 'mailAlias'
              }
            }
          };
          return callback(null, [ldap]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, ldapuser);
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
      var s = new Strategy({});

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

    it('should not provision the user on authenticate if user is not available in storage', function(done) {

      var usermodule = {
        findByEmail: function(user, callback) {
          return callback(null, {_id: 123});
        },
        provisionUser: function() {
          done(new Error());
        }
      };
      mockery.registerMock('../../user', usermodule);
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          var ldap = {
            configuration: {
              url: 'ldap://localhost:1389',
              adminDn: 'uid=admin,ou=passport-ldapauth',
              adminPassword: 'secret',
              searchBase: 'ou=passport-ldapauth',
              searchFilter: '(mail={{username}})'
            }
          };
          return callback(null, [ldap]);
        },
        authenticate: function(email, password, ldap, callback) {
          var user = {};
          return callback(null, user);
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
      var s = new Strategy({});
      s._finalize = function() {
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


    it('should call passport#error when user is not found in any LDAP', function(done) {
      var usermodule = {
        findByEmail: function(user, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../user', usermodule);
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

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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

    it('should call passport#error when LDAP search send back an error', function(done) {
      var usermodule = {
        findByEmail: function(user, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../user', usermodule);
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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

    it('should call passport#error when LDAP authenticate send back an error', function(done) {
      var usermodule = {
        findByEmail: function(user, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../user', usermodule);
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback();
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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
      var usermodule = {
        findByEmail: function(user, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../user', usermodule);
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

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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
      var usermodule = {
        findByEmail: function(user, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../user', usermodule);
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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

    it('should call passport#error if user can not be provisionned', function(done) {
      var usermodule = {
        findByEmail: function(user, callback) {
          return callback();
        },
        provisionUser: function(user, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../user', usermodule);
      var ldapmock = {
        findLDAPForUser: function(username, callback) {
          return callback(null, [{}]);
        },
        authenticate: function(email, password, ldap, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('../../ldap', ldapmock);

      Strategy = require(this.testEnv.basePath + '/backend/core/passport/ldap-mongo/strategy');
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
  });
});
