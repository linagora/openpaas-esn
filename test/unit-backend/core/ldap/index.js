'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');

describe('The ldap core module', function() {

  let getModule;

  before(function() {
    getModule = () => this.helpers.requireBackend('core/ldap');
  });

  describe('findLDAPForUser fn', function() {

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

    it('should send back error if Ldap configuration is empty', function(done) {
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

    it('should send back the ldap if LDAP configuration have been return as array of arrays where user is available in', function(done) {
      ldapConfigsMock = [{
        config: [{
          configuration: {}
        }]
      }, {
        config: [{
          configuration: { include: true }
        }, {
          configuration: { include: true }
        }]
      }];

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        expect(ldaps).to.exist;
        expect(ldaps.length).to.equal(2);
        done(err);
      });
    });

    it('should send back the ldap if LDAP configuration have been return as array of objects where user is available in', function(done) {
      ldapConfigsMock = [{
        config: {
          configuration: {}
        }
      }, {
        config: {
          configuration: { include: true }
        }
      }, {
        config: {
          configuration: { include: true }
        }
      }];

      ldap.findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        expect(ldaps).to.exist;
        expect(ldaps.length).to.equal(2);
        done();
      });
    });

    it('should send back all LDAP configurations that contain user even when one of LDAP configuration causes error', function(done) {
      ldapConfigsMock = [{
        config: {
          name: 'config1'
        }
      }, {
        config: {
          name: 'config2',
          configuration: { include: true }
        }
      }, {
        config: {
          name: 'config3',
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
        on: function() {}
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
      var ldapmock = function() {
        return {
          authenticate: function(email, password, callback) {
            return callback(null, {_id: 123});
          },
          close: function() {}
        };
      };

      mockery.registerMock('ldapauth-fork', ldapmock);

      getModule().authenticate('me', 'secret', {}, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        done();
      });
    });

    it('should send back error if auth fails', function(done) {
      var ldapmock = function() {
        return {
          authenticate: function(email, password, callback) {
            return callback(new Error());
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

    it('should translate LDAP user to OpenPaaS user', function() {
      var ldapPayload = {
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
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username]
        }],
        domains: [{
          domain_id: ldapPayload.domainId
        }]
      };

      expect(getModule().translate(null, ldapPayload)).to.deep.equal(expectedUser);
    });

    it('should add domain to based user if it is not included', function() {
      var ldapPayload = {
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
      var baseUser = {
        domains: [{
          domain_id: 'domain456'
        }]
      };
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username]
        }],
        domains: [{
          domain_id: 'domain456'
        }, {
          domain_id: ldapPayload.domainId
        }]
      };

      expect(getModule().translate(baseUser, ldapPayload)).to.deep.equal(expectedUser);
    });

    it('should not domain to based user if it is already included', function() {
      var ldapPayload = {
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
      var baseUser = {
        domains: [{
          domain_id: ldapPayload.domainId
        }]
      };
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username]
        }],
        domains: [{
          domain_id: ldapPayload.domainId
        }]
      };

      expect(getModule().translate(baseUser, ldapPayload)).to.deep.equal(expectedUser);
    });

    it('should not add null domain to based user', function() {
      var ldapPayload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        config: {
          mapping: {
            firsname: 'name'
          }
        },
        domainId: null
      };
      var baseUser = {
        domains: [{
          domain_id: 'domain123'
        }]
      };
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username]
        }],
        domains: [{
          domain_id: 'domain123'
        }]
      };

      expect(getModule().translate(baseUser, ldapPayload)).to.deep.equal(expectedUser);
    });

    it('should add email to based user account if it is not included', function() {
      var ldapPayload = {
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
      var baseUser = {
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['other@email']
        }]
      };
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['other@email', ldapPayload.username]
        }],
        domains: [{
          domain_id: ldapPayload.domainId
        }]
      };

      expect(getModule().translate(baseUser, ldapPayload)).to.deep.equal(expectedUser);
    });

    it('should not add email to based user account if it is already included', function() {
      var ldapPayload = {
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
      var baseUser = {
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username]
        }]
      };
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username]
        }],
        domains: [{
          domain_id: ldapPayload.domainId
        }]
      };

      expect(getModule().translate(baseUser, ldapPayload)).to.deep.equal(expectedUser);
    });

    it('should add email to based user account if it is not included and defined in mapping', function() {
      var ldapPayload = {
        username: 'user@email',
        user: {
          name: 'Alice',
          mailAlias: 'alias@email'
        },
        config: {
          mapping: {
            firsname: 'name',
            email: 'mailAlias'
          }
        },
        domainId: 'domain123'
      };
      var baseUser = {};
      var expectedUser = {
        firsname: ldapPayload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [ldapPayload.username, ldapPayload.user.mailAlias]
        }],
        domains: [{
          domain_id: ldapPayload.domainId
        }]
      };

      expect(getModule().translate(baseUser, ldapPayload)).to.deep.equal(expectedUser);
    });

  });

  describe('The search fn', function() {
    var user, ldapUsersMock;
    var esnConfigMock, ldapConfigsMock;

    beforeEach(function() {
      ldapConfigsMock = [
        {
          name: 'linagora',
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
          on: function() {}
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

    it('should only return an empty array when all the searchs failed', function(done) {
      mockery.registerMock('ldapauth-fork', function(ldapConf) {
        return {
          opts: ldapConf,
          mapping: ldapConf.mapping,
          _search: function(searchBase, opts, callback) {
            return callback(new Error('something error'));
          },
          on: function() {}
        };
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
        done();
      });
    });
  });
});
