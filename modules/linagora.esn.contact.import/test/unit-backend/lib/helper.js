const { expect } = require('chai');

describe('The contact import helper module', function() {
  let user, account, getModule;
  let addressBookMock, technicalUserModuleMock, coreDbModuleMock, coreUserModuleMock, contactModuleMock;

  const type = 'twitter';
  const id = 123;
  const domainId = 456;
  const username = 'myusername';

  beforeEach(function() {
    addressBookMock = {};

    account = {
      data: {
        username: username,
        provider: type,
        id: id
      }
    };

    user = {
      _id: '123456789',
      domains: [
        { domain_id: domainId }
      ],
      accounts: [
        account,
        {
          data: {
            provider: 'test',
            id: id
          }
        }
      ]
    };
    technicalUserModuleMock = {};
    coreDbModuleMock = {
      mongo: {
        mongoose: {
          model: () => ({})
        }
      }
    };
    coreUserModuleMock = {};
    contactModuleMock = {
      lib: {
        client: () => ({
          addressbookHome: () => ({
            addressbook: () => addressBookMock
          })
        })
      }
    };

    this.moduleHelpers.addDep('contact', contactModuleMock);
    this.moduleHelpers.addDep('technical-user', technicalUserModuleMock);
    this.moduleHelpers.addDep('user', coreUserModuleMock);
    this.moduleHelpers.addDep('db', coreDbModuleMock);

    getModule = () => require('../../../backend/lib/helper')(this.moduleHelpers.dependencies);
  });

  describe('The initializeAddressBook function', function() {
    function getFunction(options) {
      return getModule().initializeAddressBook(options);
    }

    it('should reject if user token generation fails', function(done) {
      const error = new Error('Token generation failure');
      const options = {
        user: user,
        account: account
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => {
        expect(user).to.deep.equal(options.user);

        return callback(error);
      };

      getFunction(options).then(done, function(err) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should reject if user token generation does not return a token', function(done) {
      const options = {
        user: user,
        account: account
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => callback();

      getFunction(options).then(done, function(err) {
        expect(err.message).to.match(/Can not generate user token for contact addressbook creation/);
        done();
      });
    });

    it('should create contact client with the right paramters', function(done) {
      const token = {
        token: 'MyToken'
      };
      const options = {
        account: account,
        user: user
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => callback(null, token);

      contactModuleMock.lib.client = options => {
        expect(options).to.deep.equal({
          ESNToken: token.token,
          user: options.user
        });
        done();

        return ({
          addressbookHome: () => ({
            addressbook: () => ({ get: () => Promise.resolve() })
          })
        });
      };

      getFunction(options);
    });

    it('should not create dupliate AB if the AB with the same ID is existing', function(done) {
      const token = {
        token: 'MyToken'
      };
      const options = {
        account: account,
        user: user
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => callback(null, token);
      addressBookMock = {
        create: function() {
          done(new Error('Should not call create fn'));
        },
        get: function() {
          return Promise.resolve('Existing AB');
        }
      };

      getFunction(options).then(function(data) {
        expect(data.addressbook.id).to.equal(options.account.data.id);
        done();
      }, done);
    });

    it('should reject if AB creation fails', function(done) {
      const token = {
        token: 'MyToken'
      };
      const error = new Error('AB creation failure');
      const options = {
        account: account,
        user: user
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => callback(null, token);
      addressBookMock = {
        create: function(addressbook) {
          expect(addressbook.id).to.equal(options.account.data.id);

          return Promise.reject(error);
        },
        get: function() {
          return Promise.reject();
        }
      };

      getFunction(options).then(done, function(err) {
        expect(err).to.equal(error);
        done();
      });

    });

    it('should resolve and set AB in result when AB creation resolves', function(done) {
      const token = {
        token: 'MyToken'
      };
      const options = {
        account: account,
        user: user
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => callback(null, token);

      addressBookMock = {
        create: function(addressbook) {
          expect(addressbook.id).to.equal(options.account.data.id);

          return Promise.resolve({});
        },
        get: function() {
          return Promise.reject();
        }
      };

      getFunction(options).then(function(result) {
        expect(result.account).to.deep.equal(options.account);
        expect(result.user).to.deep.equal(options.user);
        expect(result.addressbook).to.exist;
        done();
      }, done);
    });

    it('should create AB with correct params', function(done) {
      const token = {
        token: 'MyToken'
      };
      const options = {
        account: account,
        user: user
      };

      coreUserModuleMock.getNewToken = (user, ttl, callback) => callback(null, token);

      const addressbookTest = {
        id: options.account.data.id,
        'dav:name': account.data.username + ' contacts on ' + account.data.provider,
        'carddav:description': 'AddressBook for ' + account.data.username + ' ' + account.data.provider + ' contacts',
        'dav:acl': ['dav:read'],
        type: account.data.provider
      };

      addressBookMock = {
        create: function(addressbook) {
          expect(addressbook).to.deep.equal(addressbookTest);
          done();
        },
        get: function() {
          return Promise.reject();
        }
      };
      getFunction(options);
    });
  });

  describe('The getImporterOptions function', function() {
    beforeEach(function() {
      const UserModel = function User(user) {
        this._id = user._id;
        this.preferredDomainId = domainId;
      };

      UserModel.prototype.toObject = function({ virtuals }) {
        expect(virtuals).to.be.true;

        return this;
      };

      coreDbModuleMock.mongo.mongoose = this.helpers.mock.models({ User: UserModel });
    });

    function getFunction(user, account) {
      return getModule().getImporterOptions(user, account);
    }

    it('should reject if technical user lookup fails', function(done) {
      const err = new Error('Find failure');

      technicalUserModuleMock.findByTypeAndDomain = (type, domain, callback) => {
        expect(type).to.equal('dav');
        expect(domain).to.equal(domainId);

        return callback(err);
      };
      getFunction(user, account).then(done, _err => {
        expect(_err.message).to.equal(err.message);
        done();
      });
    });

    it('should reject technical user lookup sends back undefined user list', function(done) {
      technicalUserModuleMock.findByTypeAndDomain = (type, domain, callback) => {
        expect(type).to.equal('dav');
        expect(domain).to.equal(domainId);

        return callback();
      };

      getFunction(user, account).then(done, err => {
        expect(err.message).to.match(/Can not find technical user for contact import/);
        done();
      });
    });

    it('should reject technical user lookup sends back empty user list', function(done) {
      technicalUserModuleMock.findByTypeAndDomain = (type, domain, callback) => {
        expect(type).to.equal('dav');
        expect(domain).to.equal(domainId);

        return callback(null, []);
      };

      getFunction(user, account).then(done, err => {
        expect(err.message).to.match(/Can not find technical user for contact import/);
        done();
      });
    });

    it('should reject if technical user token generation fails', function(done) {
      const err = new Error('Token failure');

      technicalUserModuleMock.findByTypeAndDomain = (type, domain, callback) => {
        expect(type).to.equal('dav');
        expect(domain).to.equal(domainId);

        return callback(null, [{}]);
      };
      technicalUserModuleMock.getNewToken = (user, ttl, callback) => callback(err);

      getFunction(user, account).then(done, _err => {
        expect(_err.message).to.equal(err.message);
        done();
      });
    });

    it('should reject if technical user token generation does not send back token', function(done) {
      technicalUserModuleMock.findByTypeAndDomain = (type, domain, callback) => {
        expect(type).to.equal('dav');
        expect(domain).to.equal(domainId);

        return callback(null, [{}]);
      };
      technicalUserModuleMock.getNewToken = (user, ttl, callback) => callback();

      getFunction(user, account).then(done, err => {
        expect(err.message).to.match(/Can not generate token for contact import/);
        done();
      });
    });

    it('should resolve with the generated token in options', function(done) {
      const token = {
        token: 'MyToken'
      };

      technicalUserModuleMock.findByTypeAndDomain = (type, domain, callback) => {
        expect(type).to.equal('dav');
        expect(domain).to.equal(domainId);

        return callback(null, [{}]);
      };
      technicalUserModuleMock.getNewToken = (user, ttl, callback) => callback(null, token);

      getFunction(user, account).then(result => {
        expect(result.esnToken).to.equal(token.token);
        done();
      }, done);
    });
  });

  describe('The cleanOutdatedContacts fn', function() {
    it('should call contact client to remove outdated contacts', function(done) {
      const addressbook = { id: 'contacts' };
      const lastSyncTimestamp = 12345678;
      const options = {
        user: user,
        addressbook: addressbook,
        esnToken: '12345'
      };

      addressBookMock.vcard = () => ({
        removeMultiple: options => {
          expect(options.modifiedBefore).to.equal(Math.round(lastSyncTimestamp / 1000));
          done();

          return Promise.resolve([]);
        }
      });

      getModule().cleanOutdatedContacts(options, lastSyncTimestamp);
    });
  });
});
