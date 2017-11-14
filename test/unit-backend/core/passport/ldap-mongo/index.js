'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('The ldap-mongo passport strategy', function() {
  const USERNAME = 'user@email';
  const PASSWORD = 'secret';
  let getModule;
  let existingUser, translatedUser, provisionedUser, updatedUser, ldapUser;
  let coreUserMock, coreLdapMock, loggerMock;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/passport/ldap-mongo');

    existingUser = null;
    translatedUser = { _id: 'translatedUser' };
    provisionedUser = { _id: 'provisionedUser' };
    updatedUser = { _id: 'updatedUser' };
    ldapUser = { email: 'user@ldap' };
    coreUserMock = {
      findByEmail: sinon.spy((email, callback) => callback(null, existingUser)),
      provisionUser: sinon.spy((user, callback) => callback(null, provisionedUser)),
      update: sinon.spy((user, callback) => callback(null, updatedUser))
    };
    coreLdapMock = {
      findLDAPForUser(username, callback) {
        callback(null, [{}, {}]);
      },
      translate: sinon.spy(() => translatedUser),
      authenticate(username, password, configuration, callback) {
        callback(null, ldapUser);
      }
    };
    loggerMock = { debug: sinon.spy(), error: sinon.spy(), warn: sinon.spy() };
    mockery.registerMock('../../user', coreUserMock);
    mockery.registerMock('../../ldap', coreLdapMock);
    mockery.registerMock('../../logger', loggerMock);
  });

  it('should fail with false if it fails to find LDAP directories containing the user', function(done) {
    coreLdapMock.findLDAPForUser = (username, callback) => {
      callback(new Error('an_error'));
    };

    const callback = (err, user, flash) => {
      expect(err).to.not.exist;
      expect(user).to.equal(false);
      expect(flash.message).to.contain('LDAP is not configured for user');
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with false if it no LDAP directories containing the user', function(done) {
    coreLdapMock.findLDAPForUser = (username, callback) => {
      callback(null, []);
    };

    const callback = (err, user, flash) => {
      expect(err).to.not.exist;
      expect(user).to.equal(false);
      expect(flash.message).to.contain('Can not find any LDAP for this user');
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with false if the user fails to authenticate against all LDAP directories (invalid credentials)', function(done) {
    ldapUser = null;

    const callback = (err, user) => {
      expect(err).to.not.exist;
      expect(user).to.equal(false);
      expect(loggerMock.debug).to.have.been.calledWith(sinon.match(/user not found or invalid password/));
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with error if there is error while authenticating user against all LDAP directories', function(done) {
    coreLdapMock.authenticate = (username, password, configuration, callback) => {
      callback(new Error('an_error'));
    };

    const callback = (err, user) => {
      expect(err.message).to.equal('an_error');
      expect(user).to.not.exist;
      expect(loggerMock.error).to.have.been.calledWith(sinon.match(/Error while authenticating user/));
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with error if there is error while authenticating user against one LDAP directory and the user is not authenticated in the other one', function(done) {
    let firstCall = true;

    ldapUser = null;
    coreLdapMock.authenticate = (username, password, configuration, callback) => {
      if (firstCall) {
        firstCall = false;
        callback(null, ldapUser);
      } else {
        callback(new Error('an_error'));
      }
    };

    const callback = (err, user) => {
      expect(err.message).to.equal('an_error');
      expect(user).to.not.exist;
      expect(loggerMock.error).to.have.been.calledWith(sinon.match(/Error while authenticating user/));
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with error if it authenticated user but fails to look for user by email', function(done) {
    coreUserMock.findByEmail = (email, callback) => callback(new Error('an_error'));

    const callback = (err, user) => {
      expect(err.message).to.equal('an_error');
      expect(user).to.not.exist;
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with error if it authenticated user but fails to provision user', function(done) {
    coreUserMock.provisionUser = (user, callback) => callback(new Error('an_error'));

    const callback = (err, user) => {
      expect(err.message).to.equal('an_error');
      expect(user).to.not.exist;
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should fail with error if it authenticated user but fails to update user', function(done) {
    existingUser = { _id: 'existingUser' };
    coreUserMock.update = (user, callback) => callback(new Error('an_error'));

    const callback = (err, user) => {
      expect(err.message).to.equal('an_error');
      expect(user).to.not.exist;
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should provision user authenticated in the first LDAP directory', function(done) {
    let firstCall = true;

    coreLdapMock.authenticate = (username, password, configuration, callback) => {
      if (firstCall) {
        firstCall = false;
        callback(null, ldapUser);
      } else {
        callback(null, {});
      }
    };

    const callback = (err, user) => {
      expect(err).to.not.exist;
      expect(coreLdapMock.translate).to.have.been.calledWith(existingUser, sinon.match({
        user: ldapUser
      }));
      expect(coreUserMock.provisionUser).to.have.been.calledWith(translatedUser);
      expect(user).to.deep.equal(provisionedUser);
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should provision user authenticated in a LDAP directory even when the other failed', function(done) {
    let firstCall = true;

    coreLdapMock.authenticate = (username, password, configuration, callback) => {
      if (firstCall) {
        firstCall = false;
        callback(null, false);
      } else {
        callback(null, ldapUser);
      }
    };

    const callback = (err, user) => {
      expect(err).to.not.exist;
      expect(coreLdapMock.translate).to.have.been.calledWith(existingUser, sinon.match({
        user: ldapUser
      }));
      expect(coreUserMock.provisionUser).to.have.been.calledWith(translatedUser);
      expect(user).to.deep.equal(provisionedUser);
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should provision user authenticated in a LDAP directory even when the other got error', function(done) {
    let firstCall = true;

    coreLdapMock.authenticate = (username, password, configuration, callback) => {
      if (firstCall) {
        firstCall = false;
        callback(new Error('an_error'));
      } else {
        callback(null, ldapUser);
      }
    };

    const callback = (err, user) => {
      expect(err).to.not.exist;
      expect(coreLdapMock.translate).to.have.been.calledWith(existingUser, sinon.match({
        user: ldapUser
      }));
      expect(coreUserMock.provisionUser).to.have.been.calledWith(translatedUser);
      expect(user).to.deep.equal(provisionedUser);
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  it('should update the user if he already exists', function(done) {
    existingUser = { _id: 'existingUser' };

    const callback = (err, user) => {
      expect(err).to.not.exist;
      expect(coreLdapMock.translate).to.have.been.calledWith(existingUser, sinon.match({
        user: ldapUser
      }));
      expect(coreUserMock.update).to.have.been.calledWith(translatedUser);
      expect(user).to.deep.equal(updatedUser);
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });
});
