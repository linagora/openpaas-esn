const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The ldap-mongo passport strategy', function() {
  const USERNAME = 'user@email';
  const PASSWORD = 'secret';
  let getModule;
  let existingUser, translatedUser, provisionedUser, updatedUser, ldapUser, autoProvisioningResult;
  let coreUserMock, coreLdapMock, loggerMock, helpersMock, setUserMetadataMock;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/passport/ldap-mongo');

    existingUser = null;
    translatedUser = { _id: 'translatedUser' };
    provisionedUser = { _id: 'provisionedUser' };
    updatedUser = { _id: 'updatedUser' };
    ldapUser = { email: 'user@ldap' };
    autoProvisioningResult = true;
    setUserMetadataMock = () => Promise.resolve();

    coreUserMock = {
      findByEmail: sinon.spy((email, callback) => callback(null, existingUser)),
      provisionUser: sinon.spy((user, callback) => callback(null, provisionedUser)),
      update: sinon.spy((user, callback) => callback(null, updatedUser)),
      metadata: () => ({
        set: setUserMetadataMock
      })
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
    helpersMock = {
      isLdapUsedForAutoProvisioning() {
        return autoProvisioningResult;
      }
    };
    loggerMock = { debug: sinon.spy(), error: sinon.spy(), warn: sinon.spy() };
    mockery.registerMock('../../user', coreUserMock);
    mockery.registerMock('../../ldap', coreLdapMock);
    mockery.registerMock('../../logger', loggerMock);
    mockery.registerMock('../../ldap/helpers', helpersMock);
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

  it('should not provision user if the toggle \'auto-provision\' is false', function(done) {
    autoProvisioningResult = false;

    const callback = (err, user) => {
      expect(err).to.not.exist;
      expect(user).to.equal(false);
      expect(helpersMock.isLdapUsedForAutoProvisioning()).to.equal(false);
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
      if (err) return done(err);

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

  it('should find existing user by email and update if the user is existing', function(done) {
    existingUser = { _id: 'existingUser' };

    const callback = (err, user) => {
      if (err) { return done(err); }

      expect(coreUserMock.findByEmail).to.have.been.calledWith(USERNAME, sinon.match.func);
      expect(coreLdapMock.translate).to.have.been.calledWith(existingUser, sinon.match({
        user: ldapUser
      }));
      expect(coreUserMock.update).to.have.been.calledWith(translatedUser);
      expect(user).to.deep.equal(updatedUser);
      done();
    };

    getModule()(USERNAME, PASSWORD, callback);
  });

  describe('saving user provisioned fields and blocked fields', function() {
    const mapping = {
      firstname: 'name',
      lastname: 'sn'
    };

    it('should not update user metadata if provisioning user failed', function(done) {
      coreUserMock.provisionUser = (user, callback) => callback(new Error('destined to fail'));
      setUserMetadataMock = sinon.spy();

      const callback = err => {
        expect(err.message).to.equal('destined to fail');
        expect(setUserMetadataMock).to.not.have.been.called;
        done();
      };

      getModule()(USERNAME, PASSWORD, callback);
    });

    it('should not update user metadata if updating existing user failed', function(done) {
      existingUser = { _id: 'existingUser' };
      coreUserMock.update = (user, callback) => callback(new Error('destined to fail'));
      setUserMetadataMock = sinon.spy();

      const callback = err => {
        expect(err.message).to.equal('destined to fail');
        expect(setUserMetadataMock).to.not.have.been.called;
        done();
      };

      getModule()(USERNAME, PASSWORD, callback);
    });

    it('should update user metadata after provision user', function(done) {
      coreLdapMock.findLDAPForUser = (user, callback) => callback(null, [{ configuration: { mapping } }]);
      setUserMetadataMock = sinon.stub().returns(Promise.resolve());

      const callback = err => {
        if (err) return done(err);

        expect(setUserMetadataMock).to.have.been.calledWith('profileProvisionedFields', ['firstname', 'lastname']);
        done();
      };

      getModule()(USERNAME, PASSWORD, callback);
    });

    it('should update user metadata after updating existing user', function(done) {
      existingUser = { _id: 'existingUser' };
      coreLdapMock.findLDAPForUser = (user, callback) => callback(null, [{ configuration: { mapping } }]);
      setUserMetadataMock = sinon.stub().returns(Promise.resolve());

      const callback = err => {
        if (err) return done(err);

        expect(setUserMetadataMock).to.have.been.calledWith('profileProvisionedFields', ['firstname', 'lastname']);
        done();
      };

      getModule()(USERNAME, PASSWORD, callback);
    });
  });
});
