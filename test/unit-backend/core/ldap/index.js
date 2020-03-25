const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The ldap core module', function() {
  let getModule, coreUserMock;
  let connectionManagerMock;

  beforeEach(function() {
    coreUserMock = {
      provision: {
        service: {
          addProvider: () => {}
        }
      }
    };

    connectionManagerMock = {};

    mockery.registerMock('./connection-manager', connectionManagerMock);
    mockery.registerMock('../user', coreUserMock);

    getModule = () => this.helpers.requireBackend('core/ldap');
  });

  describe('The findLDAPForUser method', function() {
    var esnConfigMock, ldapConfigsMock;

    beforeEach(function() {
      ldapConfigsMock = [];
      esnConfigMock = {
        getFromAllDomains: sinon.spy(function() {
          return Promise.resolve(ldapConfigsMock);
        })
      };

      mockery.registerMock('../esn-config', function(configName) {
        expect(configName).to.equal('ldap');

        return esnConfigMock;
      });

      connectionManagerMock.get = ldapConf => ({
        on: function() {},
        _findUser: function(email, callback) {
          if (ldapConf.include === true) {
            return callback(null, {});
          }

          return callback();
        }
      });
    });

    it('should send back error if it fails to get LDAP configuration', function(done) {
      esnConfigMock.getFromAllDomains = () => Promise.reject(new Error('an_error'));

      getModule().findLDAPForUser('foo@bar.com', function(err) {
        expect(err.message).to.equal('an_error');
        done();
      });
    });

    it('should send back error if LDAP configuration is empty', function(done) {
      getModule().findLDAPForUser('foo@bar.com', function(err) {
        expect(err).to.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back error if LDAP configuration is null', function(done) {
      ldapConfigsMock = null;

      getModule().findLDAPForUser('foo@bar.com', function(err) {
        expect(err).to.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back error if no LDAP configuration is configured for authentication', function(done) {
      ldapConfigsMock = [{
        config: [{
          usage: { auth: false },
          configuration: {}
        }]
      }];

      getModule().findLDAPForUser('foo@bar.com', function(err) {
        expect(err.message).to.equal('No LDAP configured for authentication');
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back an array of LDAP which are used for authentication and contain the user (when each domain contains an array of LDAP config)', function(done) {
      ldapConfigsMock = [{
        config: [{
          name: 'LDAP1',
          usage: { auth: false },
          configuration: {
            url: 'ldap1',
            include: true
          }
        }]
      }, {
        config: [{
          name: 'LDAP2.1',
          usage: { auth: true },
          configuration: {
            url: 'ldap2.1',
            include: true
          }
        }, {
          name: 'LDAP2.2',
          usage: { auth: true },
          configuration: {
            url: 'ldap2.2',
            include: false
          }
        }]
      }];

      getModule().findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        expect(ldaps).to.shallowDeepEqual([ldapConfigsMock[1].config[0]]);

        done();
      });
    });

    it('should send back an array of LDAP which are used for authentication and contain the user (when each domain contains 1 LDAP config)', function(done) {
      ldapConfigsMock = [{
        config: {
          name: 'LDAP1',
          usage: { auth: true },
          configuration: {
            url: 'ldap1',
            include: false
          }
        }
      }, {
        config: {
          name: 'LDAP2',
          usage: { auth: true },
          configuration: {
            url: 'ldap2',
            include: true
          }
        }
      }, {
        name: 'LDAP3',
        usage: { auth: false },
        config: {
          configuration: {
            url: 'ldap3',
            include: true
          }
        }
      }];

      getModule().findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;

        expect(ldaps).to.shallowDeepEqual([ldapConfigsMock[1].config]);

        done();
      });
    });

    it('should send back all LDAP configurations that contain user even when one of LDAP configuration causes error', function(done) {
      ldapConfigsMock = [{
        config: {
          usage: { auth: true },
          name: 'config1'
        }
      }, {
        config: {
          name: 'config2',
          usage: { auth: true },
          configuration: {
            url: 'ldap2',
            include: true
          }
        }
      }, {
        config: {
          name: 'config3',
          usage: { auth: true },
          configuration: {
            url: 'ldap3',
            include: true
          }
        }
      }];

      getModule().findLDAPForUser('foo@bar.com', (err, ldaps) => {
        expect(err).to.not.exist;
        expect(ldaps).to.shallowDeepEqual([ldapConfigsMock[1].config, ldapConfigsMock[2].config]);
        done();
      });
    });
  });

  describe('The emailExists method', function() {
    let ldapAuthMock;

    beforeEach(function() {
      ldapAuthMock = {
        on: () => {}
      };

      connectionManagerMock.get = sinon.stub().returns(ldapAuthMock);
      connectionManagerMock.close = sinon.spy();
    });

    it('should send back error if email is not set', function() {
      const callbackSpy = sinon.spy();

      getModule().emailExists(null, 'secret', callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should send back error if ldap config is not set', function() {
      const callbackSpy = sinon.spy();

      getModule().emailExists('foo@bar.com', null, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should send back error if failed to get cached ldap connection', function() {
      const callbackSpy = sinon.spy();
      const ldapConf = { url: 'bar' };
      const error = new Error('something wrong');

      connectionManagerMock.get = sinon.spy(() => {
        throw error;
      });

      getModule().emailExists('foo@bar.com', ldapConf, callbackSpy);

      expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
      expect(callbackSpy).to.have.been.calledWith(error);
    });

    it('should call the callback with data when find user successfully', function() {
      const callbackSpy = sinon.spy();
      const user = { _id: '123' };
      const ldapConf = { url: 'foo' };

      ldapAuthMock._findUser = (email, callback) => callback(null, user);

      getModule().emailExists('foo@bar.com', ldapConf, callbackSpy);

      expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
      expect(callbackSpy).to.have.been.calledWith(null, user);
    });

    it('should handle error of _findUser function by calling callback with error object', function() {
      const callbackSpy = sinon.spy();
      const ldapConf = { url: 'foo' };

      ldapAuthMock._findUser = (email, callback) => callback(new Error());

      getModule().emailExists('foo@bar.com', ldapConf, callbackSpy);

      expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should handle error event of the LdapAuth by calling callback with error object', function() {
      const callbackSpy = sinon.spy();
      const ldapConf = { url: 'foo' };

      ldapAuthMock._findUser = function() {};
      ldapAuthMock.on = (evt, listener) => listener(new Error());

      getModule().emailExists('foo@bar.com', ldapConf, callbackSpy);

      expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
      expect(connectionManagerMock.close).to.have.been.calledWith(ldapConf.url);
      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should call callback only once even when error event is fired more than one time', function() {
      const callbackSpy = sinon.spy();
      const ldapConf = { url: 'foo' };
      let listener;

      ldapAuthMock._findUser = function() {};
      ldapAuthMock.on = (evt, _listener) => { listener = _listener; };

      getModule().emailExists('foo@bar.com', ldapConf, callbackSpy);

      listener();
      listener();
      listener();

      expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
      expect(connectionManagerMock.close).to.have.been.calledOnce;
      expect(connectionManagerMock.close).to.have.been.calledWith(ldapConf.url);
      expect(callbackSpy).to.have.been.calledOnce;
    });
  });

  describe('authenticate method', function() {
    let ldapAuthMock;

    beforeEach(function() {
      ldapAuthMock = {};
      connectionManagerMock.get = sinon.stub().returns(ldapAuthMock);
      connectionManagerMock.close = sinon.spy();
    });

    it('should send back error if email is not set', function(done) {
      getModule().authenticate(null, 'secret', {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if password is not set', function(done) {
      getModule().authenticate('me', null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if ldap config is not set', function(done) {
      getModule().authenticate('me', 'secret', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if failed to get ldap connection', function(done) {
      const error = new Error('something wrong');
      const ldapConf = { url: 'bar' };

      connectionManagerMock.get = sinon.spy(() => {
        throw error;
      });

      getModule().authenticate('me', 'secret', ldapConf, function(err) {
        expect(err).to.exist;
        expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
        done();
      });
    });

    it('should send back the user if auth is OK', function(done) {
      const user = { _id: 123 };
      const ldapConf = { url: 'foo' };

      ldapAuthMock.authenticate = (email, password, callback) => callback(null, user);

      getModule().authenticate('me', 'secret', ldapConf, function(err, authenticatedUser) {
        expect(err).to.not.exist;
        expect(authenticatedUser).to.deep.equal(user);
        expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
        done();
      });
    });

    it('should send back error if auth fails', function(done) {
      const ldapConf = { url: 'foo' };

      ldapAuthMock.authenticate = (email, password, callback) => callback(new Error());

      getModule().authenticate('me', 'secret', ldapConf, function(err, user) {
        expect(err).to.exist;
        expect(user).to.not.exist;
        expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
        done();
      });
    });

    it('should not send back error if auth does not return user', function(done) {
      const ldapConf = { url: 'foo' };

      ldapAuthMock.authenticate = (email, password, callback) => callback();

      getModule().authenticate('me', 'secret', ldapConf, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.not.exist;
        expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
        done();
      });
    });

    it('should send back null user if auth fails because of invalid credentials', function(done) {
      const error = new Error();
      const ldapConf = { url: 'foo' };

      ldapAuthMock.authenticate = (email, password, callback) => callback(error);
      error.name = 'InvalidCredentialsError';

      getModule().authenticate('me', 'secret', ldapConf, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.not.exist;
        expect(connectionManagerMock.get).to.have.been.calledWith(ldapConf);
        done();
      });
    });
  });

  describe('The translate method', function() {
    it('should use the core/user to translate LDAP payload to OP user', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        config: {
          mapping: {
            firsname: 'name'
          }
        },
        domainId: 'domain123'
      };
      const baseUser = { name: 'base user' };
      const expectedUser = { name: 'expected user' };

      coreUserMock.translate = sinon.spy(() => expectedUser);

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);

      expect(coreUserMock.translate).to.have.been.calledWith(baseUser, {
        username: payload.username,
        user: payload.user,
        domainId: payload.domainId,
        mapping: payload.config.mapping
      });
    });
  });

  describe('The search method', function() {
    let user, ldapUsersMock;
    let esnConfigMock, ldapConfigsMock;

    let ldapAuthMock;

    beforeEach(function() {
      ldapConfigsMock = [
        {
          name: 'linagora',
          usage: { search: true },
          configuration: {
            url: 'ldap://localhost:389',
            adminDn: 'cn=admin,dc=nodomain',
            adminPassword: '1234',
            searchBase: 'dc=nodomain',
            searchFilter: '(mail={{username}})',
            mapping: {
              firstname: 'firstname',
              lastname: 'lastname',
              email: 'mail'
            }
          }
        }
      ];

      ldapUsersMock = [
        {
          firstname: 'first1',
          lastname: 'last1',
          mail: 'email1'
        },
        {
          firstname: 'first2',
          lastname: 'last2',
          mail: 'email2'
        }
      ];

      coreUserMock.translate = (baseUser, payload) => ({
        _id: payload.username,
        firstname: payload.user.firstname,
        lastname: payload.user.lastname,
        accounts: [{ type: 'email', hosted: true, emails: [payload.user.mail] }],
        domains: [{ domain_id: payload.domainId }]
      });

      esnConfigMock = {
        get: sinon.stub().returns(Promise.resolve(ldapConfigsMock))
      };

      esnConfigMock.forUser = sinon.stub().returns(esnConfigMock);

      mockery.registerMock('../esn-config', function(configName) {
        expect(configName).to.equal('ldap');

        return esnConfigMock;
      });
      user = { _id: '123', preferredDomainId: '123456' };

      ldapAuthMock = {
        _search: function(searchBase, opts, callback) {
          return callback(null, ldapUsersMock);
        },
        on: function() {}
      };

      connectionManagerMock.get = sinon.spy(ldapConf => {
        ldapAuthMock.opts = ldapConf;

        return ldapAuthMock;
      });
      connectionManagerMock.close = sinon.spy();
    });

    it('should return an empty list if there is no LDAP configuration', function(done) {
      esnConfigMock.get = sinon.stub().returns(Promise.resolve());

      const query = {search: 'abc', limit: 20};
      const expectResult = {
        total_count: 0,
        list: []
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        done();
      });
    });

    it('should return an empty list if there is no LDAP configuration configured for search', function(done) {
      const query = {search: 'abc', limit: 20};
      const expectResult = {
        total_count: 0,
        list: []
      };

      ldapConfigsMock[0].usage.search = false;

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        done();
      });
    });

    it('should resolve an empty array when failed to get cached connections', function(done) {
      connectionManagerMock.get = sinon.spy(() => {
        throw new Error('something wrong');
      });

      const query = {search: 'abc', limit: 20};
      const expectResult = {
        total_count: 0,
        list: []
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        done();
      }, err => done(err || 'should resolve'));
    });

    it('should only return an empty array when all the searchs failed', function(done) {
      ldapAuthMock._search = (searchBase, opts, callback) => callback(new Error('something error'));

      const query = {search: 'abc', limit: 20};
      const expectResult = {
        total_count: 0,
        list: []
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        done();
      }, err => done(err || 'should resolve'));
    });

    it('should send back correct users information after mapping', function(done) {
      const query = {search: 'abc', limit: 20};
      const expectResult = {
        total_count: 2,
        list: [
          {
            _id: 'email1',
            firstname: 'first1',
            lastname: 'last1',
            emails: ['email1'],
            domains: [{ domain_id: '123456' }],
            accounts: [
              {
                type: 'email',
                hosted: true,
                emails: ['email1']
              }
            ],
            preferredEmail: 'email1'
          },
          {
            _id: 'email2',
            firstname: 'first2',
            lastname: 'last2',
            emails: ['email2'],
            domains: [{ domain_id: '123456' }],
            accounts: [
              {
                type: 'email',
                hosted: true,
                emails: ['email2']
              }
            ],
            preferredEmail: 'email2'
          }
        ]
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        done();
      }, err => done(err || 'should resolve'));
    });

    it('should send back correct number of user limit by query.limit', function(done) {
      const query = {search: 'abc', limit: 1};
      const expectResult = {
        total_count: 2,
        list: [
          {
            _id: 'email1',
            firstname: 'first1',
            lastname: 'last1',
            emails: ['email1'],
            domains: [{ domain_id: '123456' }],
            accounts: [
              {
                type: 'email',
                hosted: true,
                emails: ['email1']
              }
            ],
            preferredEmail: 'email1'
          }
        ]
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        done();
      }, err => done(err || 'should resolve'));
    });
  });
});
