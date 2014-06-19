'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The ldap core module', function() {

  describe('findLDAPForUser fn', function() {
    it('should fail if LDAP query send back error', function(done) {

      var mockgoose = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail if LDAP query does not return result', function(done) {

      var mockgoose = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail if LDAP query send empty result', function(done) {

      var mockgoose = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback(null, []);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back the ldap where user is available in', function(done) {

      var ldaps = [{_id: 1, configuration: {}}, {_id: 2, configuration: {include: true}}, {_id: 3, configuration: {include: true}}];
      var mockgoose = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback(null, ldaps);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldapmock = function(ldap) {
        return {
          _findUser: function(email, callback) {
            if (ldap.include === true) {
              return callback(null, {});
            }
            return callback();
          }
        };
      };
      mockery.registerMock('ldapauth-fork', ldapmock);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(ldaps).to.exist;
        expect(ldaps.length).to.equal(2);
        done();
      });
    });
  });

  describe('emailExists fn', function() {

    it('should send back error if email is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.emailExists(null, 'secret', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if ldap is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.emailExists('foo@bar.com', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the callback', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldapmock = function() {
        return {
          _findUser: function(email, callback) {
            return callback();
          }
        };
      };
      mockery.registerMock('ldapauth-fork', ldapmock);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.emailExists('foo@bar.com', {}, function() {
        done();
      });
    });
  });

  describe('authenticate fn', function() {

    it('should send back error if email is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.authenticate(null, 'secret', {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if password is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.authenticate('me', null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if ldap is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.authenticate('me', 'secret', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back the user if auth is OK', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldapmock = function() {
        return {
          authenticate: function(email, password, callback) {
            return callback(null, {_id: 123});
          },
          close: function() {}
        };
      };
      mockery.registerMock('ldapauth-fork', ldapmock);


      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        done();
      });
    });

    it('should send back error if auth fails', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldapmock = function() {
        return {
          authenticate: function(email, password, callback) {
            return callback(new Error());
          },
          close: function() {}
        };
      };
      mockery.registerMock('ldapauth-fork', ldapmock);


      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.exist;
        expect(user).to.not.exist;
        done();
      });
    });

    it('should send back error if auth does not return user', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldapmock = function() {
        return {
          authenticate: function(email, password, callback) {
            return callback();
          },
          close: function() {}
        };
      };
      mockery.registerMock('ldapauth-fork', ldapmock);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.exist;
        expect(user).to.not.exist;
        done();
      });
    });
  });

  describe('findLDAPForDomain fn', function() {

    it('should send back error if domain is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForDomain(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call find with the domain id', function(done) {
      var domain = {_id: 123};
      var mockgoose = {
        model: function() {
          return {
            find: function(query, callback) {
              expect(query.domain_id).to.equals(domain._id);
              done();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForDomain(domain);
    });

    it('should call find with an id', function(done) {
      var domain = 123;
      var mockgoose = {
        model: function() {
          return {
            find: function(query, callback) {
              expect(query.domain_id).to.equals(domain);
              done();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.findLDAPForDomain(domain);
    });
  });

  describe('save fn', function() {

    it('should send back error if ldap is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.save(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if ldap configuration is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.save({domain: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if ldap domain is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.save({configuration: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('loadFromID fn', function() {

    it('should send back error if ID is not set', function(done) {
      var mockgoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mockgoose);

      var ldap = require(this.testEnv.basePath + '/backend/core/ldap');
      ldap.loadFromID(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });
});
