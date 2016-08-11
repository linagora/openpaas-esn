'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');

describe('The ldap core module', function() {

  describe('findLDAPForUser fn', function() {

    it('should send back error if Ldap configuration is empty', function(done) {
      var ldaps = [];
      var domainConfigMock = {};

      mockery.registerMock('../domain-config', domainConfigMock);

      domainConfigMock.getAllConfigs = sinon.spy(function() {
        return q(ldaps);
      });
      var ldap = this.helpers.requireBackend('core/ldap');

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.exist;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledOnce;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledWith('ldap');
        done();
      });
    });

    it('should send back error if LDAP configuration have been not return', function(done) {
      var ldaps = null;
      var domainConfigMock = {};

      mockery.registerMock('../domain-config', domainConfigMock);

      domainConfigMock.getAllConfigs = sinon.spy(function() {
        return q(ldaps);
      });
      var ldap = this.helpers.requireBackend('core/ldap');

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.exist;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledOnce;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledWith('ldap');
        done();
      });
    });

    it('should send back the ldap if LDAP configuration have been return as array of arrays where user is available in', function(done) {
      var ldaps = [[{configuration: {}}], [{configuration: {include: true}}], [{configuration: {include: true}}]];
      var domainConfigMock = {};

      mockery.registerMock('../domain-config', domainConfigMock);

      domainConfigMock.getAllConfigs = sinon.spy(function() {
        return q(ldaps);
      });
      mockery.registerMock('ldapauth-fork', function(ldap) {
        return {
          _findUser: function(email, callback) {
            if (ldap.include === true) {
              return callback(null, {});
            }
            return callback();
          }
        };
      });
      var ldap = this.helpers.requireBackend('core/ldap');

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledOnce;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledWith('ldap');
        expect(ldaps).to.exist;
        expect(ldaps.length).to.equal(2);
        done();
      });
    });

    it('should send back the ldap if LDAP configuration have been return as array of objects where user is available in', function(done) {
      var ldaps = [{configuration: {}}, {configuration: {include: true}}, {configuration: {include: true}}];
      var domainConfigMock = {};

      mockery.registerMock('../domain-config', domainConfigMock);

      domainConfigMock.getAllConfigs = sinon.spy(function() {
        return q(ldaps);
      });
      mockery.registerMock('ldapauth-fork', function(ldap) {
        return {
          _findUser: function(email, callback) {
            if (ldap.include === true) {
              return callback(null, {});
            }
            return callback();
          }
        };
      });
      var ldap = this.helpers.requireBackend('core/ldap');

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledOnce;
        expect(domainConfigMock.getAllConfigs).to.have.been.calledWith('ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
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

      var ldap = this.helpers.requireBackend('core/ldap');
      ldap.authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.exist;
        expect(user).to.not.exist;
        done();
      });
    });
  });
});
