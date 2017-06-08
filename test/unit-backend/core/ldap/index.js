'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');

describe('The ldap core module', function() {

  let getModule, coreUserMock;

  beforeEach(function() {
    coreUserMock = {};

    mockery.registerMock('../user', coreUserMock);

    getModule = () => this.helpers.requireBackend('core/ldap');
  });

  describe('The findLDAPForUser fn', function() {

    var ldap;
    var esnConfigMock, ldapConfigsMock;

    beforeEach(function() {
      ldapConfigsMock = [];
      esnConfigMock = {
        getFromAllDomains: sinon.spy(function() {
          return q(ldapConfigsMock);
        })
      };

      mockery.registerMock('../esn-config', function(configName) {
        expect(configName).to.equal('ldap');

        return esnConfigMock;
      });
      mockery.registerMock('ldapauth-fork', function(ldap) {
        return {
          on: function() {},
          close: sinon.spy(),
          _findUser: function(email, callback) {
            if (ldap.include === true) {
              return callback(null, {});
            }

            return callback();
          }
        };
      });
      ldap = this.helpers.requireBackend('core/ldap');
    });

    it('should send back error if LDAP configuration is empty', function(done) {
      ldap.findLDAPForUser('foo@bar.com', function(err) {
        expect(err).to.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back error if LDAP configuration is null', function(done) {
      ldapConfigsMock = null;

      ldap.findLDAPForUser('foo@bar.com', function(err) {
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

      ldap.findLDAPForUser('foo@bar.com', function(err) {
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
          configuration: { include: true }
        }]
      }, {
        config: [{
          name: 'LDAP2.1',
          usage: { auth: true },
          configuration: { include: true }
        }, {
          name: 'LDAP2.2',
          usage: { auth: true },
          configuration: { include: false }
        }]
      }];

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
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
          configuration: { include: false }
        }
      }, {
        config: {
          name: 'LDAP2',
          usage: { auth: true },
          configuration: { include: true }
        }
      }, {
        name: 'LDAP3',
        usage: { auth: false },
        config: {
          configuration: { include: true }
        }
      }];

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
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
          configuration: { include: true }
        }
      }, {
        config: {
          name: 'config3',
          usage: { auth: true },
          configuration: { include: true }
        }
      }];

      ldap.findLDAPForUser('foo@bar.com', (err, ldaps) => {
        expect(err).to.not.exist;
        expect(ldaps).to.shallowDeepEqual([ldapConfigsMock[1].config, ldapConfigsMock[2].config]);
        done();
      });
    });
  });

  describe('The emailExists fn', function() {

    let ldapAuthMock;

    beforeEach(function() {
      ldapAuthMock = {
        on: function() {},
        close: sinon.spy()
      };
      mockery.registerMock('ldapauth-fork', function() {
        Object.assign(this, ldapAuthMock);
      });

    });

    it('should send back error if email is not set', function() {
      const callbackSpy = sinon.spy();

      getModule().emailExists(null, 'secret', callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should send back error if ldap is not set', function() {
      const callbackSpy = sinon.spy();

      getModule().emailExists('foo@bar.com', null, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should call the callback with data when find user successfully', function() {
      const callbackSpy = sinon.spy();
      const user = {};

      ldapAuthMock._findUser = (email, callback) => callback(null, user);

      getModule().emailExists('foo@bar.com', {}, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(null, user);
    });

    it('should handle error of _findUser function by calling callback with error object', function() {
      const callbackSpy = sinon.spy();

      ldapAuthMock._findUser = (email, callback) => callback(new Error());

      getModule().emailExists('foo@bar.com', {}, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should handle error event of the LdapAuth by calling callback with error object', function() {
      const callbackSpy = sinon.spy();

      ldapAuthMock._findUser = function() {};
      ldapAuthMock.on = (evt, listener) => listener(new Error());

      getModule().emailExists('foo@bar.com', {}, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it('should call callback only once even when error event is fired more than one time', function() {
      const callbackSpy = sinon.spy();
      let listener;

      ldapAuthMock._findUser = function() {};
      ldapAuthMock.on = (evt, _listener) => { listener = _listener; };

      getModule().emailExists('foo@bar.com', {}, callbackSpy);

      listener();
      listener();
      listener();

      expect(callbackSpy).to.have.been.calledOnce;
    });

    it('should close the LDAP connection on success', function() {
      ldapAuthMock._findUser = (email, callback) => callback(null, {});

      getModule().emailExists('foo@bar.com', {}, () => {});

      expect(ldapAuthMock.close).to.have.been.calledWith();
    });

    it('should close the LDAP connection on error', function() {
      ldapAuthMock._findUser = (email, callback) => callback(new Error('Failure'));

      getModule().emailExists('foo@bar.com', {}, () => {});

      expect(ldapAuthMock.close).to.have.been.calledWith();
    });

  });

  describe('authenticate fn', function() {

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

    it('should send back error if ldap is not set', function(done) {
      getModule().authenticate('me', 'secret', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back the user if auth is OK', function(done) {
      const ldapauth = {
        authenticate: function(email, password, callback) {
          return callback(null, {_id: 123});
        },
        close: sinon.spy()
      };
      const ldapmock = function() { return ldapauth; };

      mockery.registerMock('ldapauth-fork', ldapmock);

      getModule().authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;

        expect(ldapauth.close).to.have.been.calledWith();

        done();
      });
    });

    it('should send back error if auth fails', function(done) {
      const ldapauth = {
        authenticate: function(email, password, callback) {
          return callback(new Error());
        },
        close: sinon.spy()
      };
      const ldapmock = function() { return ldapauth; };

      mockery.registerMock('ldapauth-fork', ldapmock);

      getModule().authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.exist;
        expect(user).to.not.exist;

        expect(ldapauth.close).to.have.been.calledWith();

        done();
      });
    });

    it('should send back error if auth does not return user', function(done) {
      var ldapmock = function() {
        return {
          authenticate: function(email, password, callback) {
            return callback();
          },
          close: function() {}
        };
      };

      mockery.registerMock('ldapauth-fork', ldapmock);

      getModule().authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.exist;
        expect(user).to.not.exist;
        done();
      });
    });
  });

  describe('The translate fn', function() {
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

  describe('The search fn', function() {
    var user, ldapUsersMock, ldapAuthCloseMock;
    var esnConfigMock, ldapConfigsMock;

    beforeEach(function() {
      ldapAuthCloseMock = sinon.spy();
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
        get: sinon.stub().returns(q.when(ldapConfigsMock))
      };

      esnConfigMock.forUser = sinon.stub().returns(esnConfigMock);

      mockery.registerMock('../esn-config', function(configName) {
        expect(configName).to.equal('ldap');

        return esnConfigMock;
      });
      mockery.registerMock('ldapauth-fork', function(ldapConf) {
        return {
          opts: ldapConf,
          mapping: ldapConf.mapping,
          _search: function(searchBase, opts, callback) {
            return callback(null, ldapUsersMock);
          },
          on: function() {},
          close: ldapAuthCloseMock
        };
      });
      user = { _id: '123', preferredDomainId: '123456' };
    });

    it('should return an empty list if there is no LDAP configuration', function(done) {
      esnConfigMock.get = sinon.stub().returns(q.when());

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

    it('should only return an empty array when all the searchs failed', function(done) {
      mockery.registerMock('ldapauth-fork', function(ldapConf) {
        return {
          opts: ldapConf,
          mapping: ldapConf.mapping,
          _search: function(searchBase, opts, callback) {
            return callback(new Error('something error'));
          },
          on: function() {},
          close: ldapAuthCloseMock
        };
      });

      const query = {search: 'abc', limit: 20};
      const expectResult = {
        total_count: 0,
        list: []
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        expect(ldapAuthCloseMock).to.have.been.calledWith();

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
        expect(ldapAuthCloseMock).to.have.been.calledWith();

        done();
      });
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
        expect(ldapAuthCloseMock).to.have.been.calledWith();

        done();
      });
    });
  });
});
