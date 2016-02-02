'use strict';

var q = require('q');
var chai = require('chai');
var expect = chai.expect;

describe('The contact import helper module', function() {

  var deps, user, account;
  var addressBookMock;

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../backend/lib/helper')(dependencies);
  };

  var type = 'twitter';
  var id = 123;
  var domainId = 456;
  var username = 'myusername';

  beforeEach(function() {
    addressBookMock = {};
    deps = {
      logger: {
        debug: function() {},
        info: function() {},
        error: function() {}
      },
      contact: {
        lib: {
          client: function() {
            return {
              addressbookHome: function() {
                return {
                  addressbook: function() {
                    return addressBookMock;
                  }
                };
              }
            };
          }
        }
      }
    };

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
        {domain_id: domainId}
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
  });

  describe('The initializeAddressBook function', function() {
    function getFunction(options) {
      return getModule().initializeAddressBook(options);
    }

    it('should reject if user token generation fails', function(done) {
      var e = new Error('Token generation failure');
      var options = {
        user: user,
        account: account
      };
      deps.user = {
        getNewToken: function(user, ttl, callback) {
          expect(user).to.deep.equal(options.user);
          return callback(e);
        }
      };
      getFunction(options).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should reject if user token generation does not return a token', function(done) {
      var options = {
        user: user,
        account: account
      };
      deps.user = {
        getNewToken: function(user, ttl, callback) {
          return callback();
        }
      };
      getFunction(options).then(done, function(err) {
        expect(err.message).to.match(/Can not generate user token for contact addressbook creation/);
        done();
      });
    });

    it('should not create dupliate AB if the AB with the same ID is existing', function(done) {
      var token = {
        token: 'MyToken'
      };
      var options = {
        account: account,
        user: user
      };
      deps.user = {
        getNewToken: function(user, ttl, callback) {
          return callback(null, token);
        }
      };
      addressBookMock = {
        create: function() {
          done(new Error('Should not call create fn'));
        },
        get: function() {
          return q.resolve('Existing AB');
        }
      };

      getFunction(options).then(function(data) {
        expect(data.addressbook.id).to.equal(options.account.data.id);
        done();
      }, done);
    });

    it('should reject if AB creation fails', function(done) {
      var token = {
        token: 'MyToken'
      };
      var e = new Error('AB creation failure');
      var options = {
        account: account,
        user: user
      };
      deps.user = {
        getNewToken: function(user, ttl, callback) {
          return callback(null, token);
        }
      };
      addressBookMock = {
        create: function(addressbook) {
          expect(addressbook.id).to.equal(options.account.data.id);
          return q.reject(e);
        },
        get: function() {
          return q.reject();
        }
      };

      getFunction(options).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });

    });

    it('should resolve and set AB in result when AB creation resolves', function(done) {
      var token = {
        token: 'MyToken'
      };
      var options = {
        account: account,
        user: user
      };
      deps.user = {
        getNewToken: function(user, ttl, callback) {
          return callback(null, token);
        }
      };
      addressBookMock = {
        create: function(addressbook) {
          expect(addressbook.id).to.equal(options.account.data.id);
          return q.resolve({});
        },
        get: function() {
          return q.reject();
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
      var token = {
        token: 'MyToken'
      };
      var options = {
        account: account,
        user: user
      };
      deps.user = {
        getNewToken: function(user, ttl, callback) {
          return callback(null, token);
        }
      };
      var addressbookTest = {
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
          return q.reject();
        }
      };
      getFunction(options);
    });
  });

  describe('The getImporterOptions function', function() {
    function getFunction(user, account) {
      return getModule().getImporterOptions(user, account);
    }

    it('should reject if technical user lookup fails', function(done) {
      var e = new Error('Find failure');
      deps['technical-user'] = {
        findByTypeAndDomain: function(type, domain, callback) {
          return callback(e);
        }
      };
      getFunction(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should reject technical user lookup sends back undefined user list', function(done) {
      deps['technical-user'] = {
        findByTypeAndDomain: function(type, domain, callback) {
          return callback();
        }
      };
      getFunction(user, account).then(done, function(err) {
        expect(err.message).to.match(/Can not find technical user for contact import/);
        done();
      });
    });

    it('should reject technical user lookup sends back empty user list', function(done) {
      deps['technical-user'] = {
        findByTypeAndDomain: function(type, domain, callback) {
          return callback(null, []);
        }
      };
      getFunction(user, account).then(done, function(err) {
        expect(err.message).to.match(/Can not find technical user for contact import/);
        done();
      });
    });

    it('should reject if technical user token generation fails', function(done) {
      var e = new Error('Token failure');
      deps['technical-user'] = {
        findByTypeAndDomain: function(type, domain, callback) {
          return callback(null, [{}]);
        },
        getNewToken: function(user, ttl, callback) {
          return callback(e);
        }
      };
      getFunction(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should reject if technical user token generation does not send back token', function(done) {
      deps['technical-user'] = {
        findByTypeAndDomain: function(type, domain, callback) {
          return callback(null, [{}]);
        },
        getNewToken: function(user, ttl, callback) {
          return callback();
        }
      };
      getFunction(user, account).then(done, function(err) {
        expect(err.message).to.match(/Can not generate token for contact import/);
        done();
      });
    });

    it('should resolve with the generated token in options', function(done) {
      var token = {
        token: 'MyToken'
      };
      deps['technical-user'] = {
        findByTypeAndDomain: function(type, domain, callback) {
          return callback(null, [{}]);
        },
        getNewToken: function(user, ttl, callback) {
          return callback(null, token);
        }
      };
      getFunction(user, account).then(function(result) {
        expect(result.esnToken).to.equal(token.token);
        done();
      }, done);
    });
  });

  describe('The cleanOutdatedContacts fn', function() {
    it('should call contact client to remove outdated contacts', function(done) {
      var addressbook = { id: 'contacts' };
      var lastSyncTimestamp = 12345678;
      var options = {
        user: user,
        addressbook: addressbook,
        esnToken: '12345'
      };
      addressBookMock.vcard = function() {
        return {
          removeMultiple: function(options) {
            expect(options.modifiedBefore).to.equal(Math.round(lastSyncTimestamp / 1000 - 3600));
            done();
            return q.resolve();
          }
        };
      };

      getModule().cleanOutdatedContacts(options, lastSyncTimestamp);
    });
  });

});
