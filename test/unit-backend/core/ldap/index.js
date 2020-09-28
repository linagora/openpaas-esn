const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The ldap core module', function() {
  let getModule, coreUserMock;

  beforeEach(function() {
    coreUserMock = {
      provision: {
        service: {
          addProvider: () => {}
        }
      }
    };

    mockery.registerMock('../user', coreUserMock);

    getModule = () => this.helpers.requireBackend('core/ldap');
  });

  describe('The findLDAPForUser method', function() {
    let esnConfigMock, ldapConfigsMock, ClientMock;

    beforeEach(function() {
      ClientMock = function() {
        this.bind = () => Promise.resolve();
        this.unbind = () => {};
        this.search = () => Promise.resolve({
          searchEntries: [{}]
        });
      };
      mockery.registerMock('ldapts', {
        Client: ClientMock
      });

      mockery.registerMock('../user', coreUserMock);

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
          configuration: { url: 'ldap://ldap1:389', searchFilter: '(mail={{username}})' }
        }]
      }, {
        config: [{
          name: 'LDAP2.1',
          usage: { auth: true },
          configuration: { url: 'ldap://ldap2:389', searchFilter: '(mail={{username}})' }
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
          configuration: { url: 'ldap://ldap1:389', searchFilter: '(mail={{username}})' }
        }
      }, {
        config: {
          name: 'LDAP2',
          usage: { auth: false },
          configuration: { url: 'ldap://ldap2:389', searchFilter: '(mail={{username}})' }
        }
      }, {
        config: {
          name: 'LDAP3',
          usage: { auth: true },
          configuration: { url: 'ldap://ldap3:389', searchFilter: '(mail={{username}})' }
        }
      }];

      getModule().findLDAPForUser('foo@bar.com', function(err, ldaps) {
        expect(err).to.not.exist;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        expect(ldaps).to.shallowDeepEqual([ldapConfigsMock[0].config, ldapConfigsMock[2].config]);

        done();
      });
    });

    it('should send back all LDAP configurations that contain user even when one of LDAP configuration causes error', function(done) {
      ldapConfigsMock = [{
        config: {
          name: 'LDAP1',
          usage: { auth: true },
          configuration: { url: 'ldap://ldap1:389', searchFilter: '(mail={{username}})' }
        }
      }, {
        config: {
          name: 'LDAP2',
          usage: { auth: true },
          configuration: { url: 'ldap://ldap2:389', searchFilter: '(mail={{username}})' }
        }
      }, {
        config: {
          name: 'LDAP3',
          usage: { auth: true },
          configuration: { url: 'ldap://ldap3:389', searchFilter: '(mail={{username}})' }
        }
      }];

      ClientMock = function({ url }) {
        this.bind = () => Promise.resolve();
        this.unbind = () => {};
        this.search = () => {
          if (url === ldapConfigsMock[1].config.configuration.url) {
            return Promise.reject(new Error('something wrong'));
          }

          return Promise.resolve({
            searchEntries: [{}]
          });
        };
      };

      mockery.registerMock('ldapts', {
        Client: ClientMock
      });

      getModule().findLDAPForUser('foo@bar.com', (err, ldaps) => {
        expect(err).to.not.exist;
        expect(ldaps).to.shallowDeepEqual([ldapConfigsMock[0].config, ldapConfigsMock[2].config]);
        done();
      });
    });
  });

  describe('The findDomainsBoundToEmail function', function() {
    let esnConfigMock, ClientMock, ldapSearch;

    beforeEach(function() {
      ldapSearch = sinon.stub().returns(Promise.resolve({
        searchEntries: [{}]
      }));
      ClientMock = function() {
        this.bind = () => Promise.resolve();
        this.unbind = () => {};
        this.search = () => ldapSearch;
      };
      esnConfigMock = {
        getFromAllDomains: sinon.stub()
      };

      mockery.registerMock('ldapts', {
        Client: ClientMock
      });
      mockery.registerMock('../user', coreUserMock);
      mockery.registerMock('../esn-config', function(configName) {
        expect(configName).to.equal('ldap');

        return esnConfigMock;
      });
    });

    it('should send back error if it fails to get LDAP configuration', function(done) {
      const error = new Error('I failed');

      esnConfigMock.getFromAllDomains.returns(Promise.reject(new Error('I failed')));

      getModule().findDomainsBoundToEmail('foo@bar.com', err => {
        expect(err.message).to.equal(error.message);
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back empty array when no LDAP configuration is found', function(done) {
      esnConfigMock.getFromAllDomains.returns(Promise.resolve());

      getModule().findDomainsBoundToEmail('foo@bar.com', (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.an('array').that.is.empty;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back empty array when LDAP configuration is empty', function(done) {
      esnConfigMock.getFromAllDomains.returns(Promise.resolve([]));

      getModule().findDomainsBoundToEmail('foo@bar.com', (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.an('array').that.is.empty;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back empty array when LDAP is badly configured', function(done) {
      esnConfigMock.getFromAllDomains.returns(Promise.resolve([{}, { notconfig: {}}]));

      getModule().findDomainsBoundToEmail('foo@bar.com', (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.an('array').that.is.empty;
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back empty array when LDAP search fails', function(done) {
      const ldaps = [{
        config: {
          domainId: 'domain1',
          name: 'LDAP1',
          configuration: { url: 'ldap://ldap1:389', searchFilter: '(mail={{username}})' }
        }
      }, {
        config: {
          domainId: 'domain2',
          name: 'LDAP2',
          configuration: { url: 'ldap://ldap2:389', searchFilter: '(mail={{username}})' }
        }
      }];

      ClientMock = function({ url }) {
        this.bind = () => Promise.resolve();
        this.unbind = () => {};
        this.search = () => {
          if (url === ldaps[1].config.configuration.url) {
            return Promise.reject(new Error('something wrong'));
          }

          return Promise.resolve({
            searchEntries: [{}]
          });
        };
      };

      mockery.registerMock('ldapts', {
        Client: ClientMock
      });

      esnConfigMock.getFromAllDomains.returns(Promise.resolve(ldaps));

      getModule().findDomainsBoundToEmail('foo@bar.com', (err, result) => {
        expect(err).to.not.exist;
        expect(result.length).to.equal(1);
        expect(result[0]).to.equal(ldaps[0].config.domainId);
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back the domainIds where email is found in LDAP', function(done) {
      const ldaps = [{
        config: {
          domainId: 'domain1',
          name: 'LDAP1',
          configuration: { url: 'ldap://ldap1:389', searchFilter: '(mail={{username}})' }
        }
      }, {
        config: {
          domainId: 'domain2',
          name: 'LDAP2',
          configuration: { url: 'ldap://ldap2:389', searchFilter: '(mail={{username}})' }
        }
      }];

      ClientMock = function() {
        this.bind = () => Promise.resolve();
        this.unbind = () => {};
        this.search = () => Promise.resolve({ searchEntries: [{}] });
      };

      mockery.registerMock('ldapts', {
        Client: ClientMock
      });

      esnConfigMock.getFromAllDomains.returns(Promise.resolve(ldaps));

      getModule().findDomainsBoundToEmail('foo@bar.com', (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.deep.equal([ldaps[0].config.domainId, ldaps[1].config.domainId]);
        expect(esnConfigMock.getFromAllDomains).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('The emailExists method', function() {
    let ldapSearchingResultMock, user, ldapConf;
    let unbindMock, bindMock;

    beforeEach(function() {
      user = { mail: 'foo@bar.com' };
      ldapConf = {
        url: 'ldap://ldap:389',
        searchBase: '',
        searchFilter: '',
        adminDn: 'adminDn',
        adminPassword: 'adminPassword'
      };

      ldapSearchingResultMock = Promise.resolve({
        searchEntries: [user]
      });
      unbindMock = sinon.spy();
      bindMock = sinon.stub().returns(Promise.resolve());

      mockery.registerMock('ldapts', {
        Client: function() {
          this.bind = bindMock;
          this.unbind = unbindMock;
          this.search = () => ldapSearchingResultMock;
        }
      });
    });

    it('should send back error if email is not set', function(done) {
      getModule().emailExists(null, ldapConf, err => {
        expect(err.message).to.equal('Missing parameters');
        done();
      });
    });

    it('should send back error if ldap config is not set', function(done) {
      getModule().emailExists(user.mail, null, err => {
        expect(err.message).to.equal('Missing parameters');
        done();
      });
    });

    it('should send back error if cannot create an instance of Client', function(done) {
      ldapConf = {
        url: 'an error string',
        searchBase: '',
        searchFilter: '',
        adminDn: 'adminDn',
        adminPassword: 'adminPassword'
      };
      const message = 'an error string is not a valid ldap URL';
      mockery.registerMock('ldapts', {
        Client: function() {
          throw new Error(message);
        }
      });
      getModule().emailExists(user.mail, ldapConf, err => {
        expect(err).to.exist;
        expect(err.message).to.equal(message);
        done();
      });
    });

    it('should call the callback with data when find user successfully', function(done) {
      getModule().emailExists(user.mail, ldapConf, (err, foundUser) => {
        expect(err).to.not.exist;
        expect(foundUser).to.deep.equal(user);
        expect(bindMock).to.have.been.calledWith(ldapConf.adminDn, ldapConf.adminPassword);
        done();
      });
    });

    it('should work when the LDAP admin admincredential is not provided', function(done) {
      ldapConf = {
        url: 'ldap://ldap:389',
        searchBase: '',
        searchFilter: ''
      };

      getModule().emailExists(user.mail, ldapConf, (err, foundUser) => {
        expect(err).to.not.exist;
        expect(foundUser).to.deep.equal(user);
        expect(bindMock).to.have.been.calledWith('', '');
        done();
      });
    });

    it('should return callback with error when failed to search ldap users', function(done) {
      ldapSearchingResultMock = Promise.reject(new Error('something wrong'));

      getModule().emailExists(user.mail, ldapConf, err => {
        expect(err.message).to.equal('something wrong');
        expect(bindMock).to.have.been.calledWith(ldapConf.adminDn, ldapConf.adminPassword);
        done();
      });
    });

    it('should unbind the LDAP connection on success', function(done) {
      getModule().emailExists(user.mail, ldapConf, err => {
        expect(err).to.not.exist;
        expect(bindMock).to.have.been.calledWith(ldapConf.adminDn, ldapConf.adminPassword);
        expect(unbindMock).to.have.been.calledOnce;
        done();
      });
    });

    it('should close the LDAP connection on error', function(done) {
      ldapSearchingResultMock = Promise.reject(new Error('something wrong'));

      getModule().emailExists(user.mail, ldapConf, err => {
        expect(err.message).to.equal('something wrong');
        expect(bindMock).to.have.been.calledWith(ldapConf.adminDn, ldapConf.adminPassword);
        expect(unbindMock).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('authenticate method', function() {
    let ldapSearchingResultMock, user, ldapConf;
    let bindMock, unbindMock;
    const password = 'secret';

    beforeEach(function() {
      user = { mail: 'foo@bar.com', dn: 'foo' };
      ldapConf = {
        url: 'ldap://ldap:389',
        searchBase: '',
        searchFilter: ''
      };

      ldapSearchingResultMock = Promise.resolve({
        searchEntries: [user]
      });
      unbindMock = sinon.spy();
      bindMock = sinon.stub().returns(Promise.resolve());

      mockery.registerMock('ldapts', {
        Client: function() {
          this.bind = bindMock;
          this.unbind = unbindMock;
          this.search = () => ldapSearchingResultMock;
        }
      });
    });

    it('should send back error if email is not set', function(done) {
      getModule().authenticate(null, password, ldapConf, err => {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if password is not set', function(done) {
      getModule().authenticate(user.mail, null, ldapConf, err => {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if ldap config is not set', function(done) {
      getModule().authenticate(user.mail, password, null, err => {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if cannot create an instance of Client', function(done) {
      ldapConf = {
        url: 'an error string',
        searchBase: '',
        searchFilter: '',
        adminDn: 'adminDn',
        adminPassword: 'adminPassword'
      };
      const message = 'an error string is not a valid ldap URL';
      mockery.registerMock('ldapts', {
        Client: function() {
          throw new Error(message);
        }
      });
      getModule().authenticate(user.mail, password, ldapConf, err => {
        expect(err).to.exist;
        expect(err.message).to.equal(message);
        done();
      });
    });

    it('should send back error if failed to find user in the given LDAP server', function(done) {
      ldapSearchingResultMock = Promise.reject(new Error('something wrong'));

      getModule().authenticate(user.mail, password, ldapConf, err => {
        expect(bindMock).to.have.been.calledOnce;
        expect(err.message).to.equal('something wrong');
        expect(unbindMock).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back null if there is no found user in the given LDAP server', function(done) {
      ldapSearchingResultMock = Promise.resolve({
        searchEntries: []
      });

      getModule().authenticate(user.mail, password, ldapConf, (err, _user) => {
        expect(bindMock).to.have.been.calledOnce;
        expect(err).to.be.null;
        expect(_user).to.be.null;
        expect(unbindMock).to.have.been.calledOnce;
        done();
      });
    });

    it('should send back error if failed to bind user in the given LDAP server', function(done) {
      bindMock.onCall(1).returns(Promise.reject(new Error('something wrong')));

      getModule().authenticate(user.mail, password, ldapConf, err => {
        expect(err.message).to.equal('something wrong');
        expect(bindMock.secondCall).to.have.been.calledWith(user.dn, password);
        expect(bindMock).to.have.been.calledTwice;
        expect(unbindMock).to.have.been.calledTwice;
        done();
      });
    });

    it('should send back the user if auth is OK', function(done) {
      getModule().authenticate(user.mail, password, ldapConf, (err, _user) => {
        expect(_user).to.deep.equal(user);
        expect(err).to.not.exist;
        expect(bindMock.secondCall).to.have.been.calledWith(_user.dn, password);
        expect(bindMock).to.have.been.calledTwice;
        expect(unbindMock).to.have.been.calledTwice;
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
    let searchMock;
    let bindMock, unbindMock;

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

      unbindMock = sinon.spy();
      bindMock = sinon.stub().returns(Promise.resolve());
      searchMock = sinon.stub().returns(Promise.resolve({
        searchEntries: ldapUsersMock
      }));

      mockery.registerMock('ldapts', {
        Client: function() {
          this.bind = bindMock;
          this.unbind = unbindMock;
          this.search = searchMock;
        }
      });
      user = { _id: '123', preferredDomainId: '123456' };
    });

    it('should return an empty list if there is no LDAP configuration', function(done) {
      esnConfigMock.get = sinon.stub().returns(Promise.resolve());

      const query = { search: 'abc', limit: 20 };
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
      const query = { search: 'abc', limit: 20 };
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
      searchMock = sinon.stub().returns(Promise.reject('something wrong'));

      const query = { search: 'abc', limit: 20 };
      const expectResult = {
        total_count: 0,
        list: []
      };

      getModule().search(user, query).then(result => {
        expect(result).to.deep.equal(expectResult);
        expect(unbindMock).to.have.been.calledOnce;

        done();
      }, err => done(err || 'should resolve'));
    });

    it('should only return an empty array if cannot create instance of client', function(done) {
      const message = 'an error string is not a valid ldap URL';
      mockery.registerMock('ldapts', {
        Client: function() {
          throw new Error(message);
        }
      });

      const query = { search: 'abc', limit: 20 };
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
        expect(searchMock).to.have.been.calledOnce;

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
        expect(searchMock).to.have.been.calledOnce;

        done();
      });
    });

    it('should work when the LDAP admin admincredential is not provided ', function(done) {
      ldapConfigsMock[0].configuration.adminDn = undefined;
      ldapConfigsMock[0].configuration.adminPassword = undefined;

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
        expect(searchMock).to.have.been.calledOnce;

        done();
      });
    });
  });
});
