'use strict';

var q = require('q');
var sinon = require('sinon');
var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The contact import module', function() {

  var deps, user, account;

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../backend/lib/import')(dependencies);
  };

  var jobQueueMock, pubsubMock, contactModuleMock, contactClientMock;
  var type = 'twitter';
  var id = 123;
  var domainId = 456;

  beforeEach(function() {
    contactClientMock = {
      create: function() {
        return q([]);
      }
    };
    contactModuleMock = {
      lib: {
        client: function() {
          return {
            addressbookHome: function() {
              return {
                addressbook: function() {
                  return {
                    vcard: function() {
                      return contactClientMock;
                    }
                  };
                }
              };
            }
          };
        }
      }
    };
    pubsubMock = {
      global: {
        topic: function() {
          return {
            publish: function() {}
          };
        }
      }
    };
    jobQueueMock = {
      lib: {
        submitJob: function() {},
        workers: {
          add: function() {}
        }
      }
    };
    deps = {
      logger: {
        debug: function() {},
        info: function() {},
        error: function() {}
      },
      jobqueue: jobQueueMock,
      'webserver-wrapper': {
        injectAngularModules: function() {},
        addApp: function() {}
      },
      pubsub: pubsubMock,
      contact: contactModuleMock
    };

    account =  {
      data: {
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

  describe('The importAccountContacts function', function() {

    var registryMock;

    beforeEach(function() {
      registryMock = {};
      mockery.registerMock('./registry', function() {
        return registryMock;
      });
    });

    it('should reject if importer is not found', function(done) {
      registryMock = {
        get: function(type) {
          expect(type).to.equals(account.data.provider);
          return null;
        }
      };
      getModule().importAccountContacts(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find importer ' + account.data.provider);
        done();
      });
    });

    it('should reject if importer.lib is undefined', function(done) {
      registryMock = {
        get: function(type) {
          expect(type).to.equals(account.data.provider);
          return {};
        }
      };
      getModule().importAccountContacts(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find importer ' + account.data.provider);
        done();
      });
    });

    it('should call importer with the right parameters', function(done) {

      var options = {
        account: account,
        user: user
      };
      var addressbook = {
        id: '1',
        name: 'MyAB'
      };

      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q(options);
          },
          initializeAddressBook: function(options) {
            options.addressbook = addressbook;
            return q(options);
          }
        };
      });
      registryMock = {
        get: function(type) {
          expect(type).to.equals(account.data.provider);
          return {
            lib: {
              importer: {
                importContact: function(options) {
                  expect(options.account).to.deep.equals(account);
                  expect(options.user).to.deep.equals(user);
                  expect(options.addressbook).to.deep.equals(addressbook);
                  done();
                }
              }
            }
          };
        }
      };
      getModule().importAccountContacts(user, account);
    });

    it('should reject if it fails to get importer options', function(done) {
      var e = new Error('Options error');
      registryMock = {
        get: function() {
          return { lib: { importer: function() {} }};
        }
      };
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q.reject(e);
          }
        };
      });
      getModule().importAccountContacts(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should reject if it fails to initialize address book', function(done) {
      var e = new Error('initialoze error');
      registryMock = {
        get: function() {
          return { lib: { importer: function() {} }};
        }
      };
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q({});
          },
          initializeAddressBook: function() {
            return q.reject(e);
          }
        };
      });
      getModule().importAccountContacts(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

  });

  describe('The synchronizeAccountContacts function', function() {
    var registryMock;

    beforeEach(function() {
      registryMock = {};
      mockery.registerMock('./registry', function() {
        return registryMock;
      });
    });

    it('should reject if importer is not found', function(done) {
      registryMock = {
        get: function(type) {
          expect(type).to.equals(account.data.provider);
          return null;
        }
      };
      getModule().synchronizeAccountContacts(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find importer ' + account.data.provider);
        done();
      });
    });

    it('should reject if importer.lib is undefined', function(done) {
      registryMock = {
        get: function(type) {
          expect(type).to.equals(account.data.provider);
          return {};
        }
      };
      getModule().synchronizeAccountContacts(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find importer ' + account.data.provider);
        done();
      });
    });

    it('should call importer with the right parameters', function(done) {
      var options = {
        account: account,
        user: user
      };
      var addressbook = {
        id: '1',
        name: 'MyAB'
      };

      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q(options);
          },
          initializeAddressBook: function(options) {
            options.addressbook = addressbook;
            return q(options);
          }
        };
      });
      registryMock = {
        get: function(type) {
          expect(type).to.equals(account.data.provider);
          return {
            lib: {
              importer: {
                importContact: function(options) {
                  expect(options.account).to.deep.equals(account);
                  expect(options.user).to.deep.equals(user);
                  expect(options.addressbook).to.deep.equals(addressbook);
                  done();
                }
              }
            }
          };
        }
      };
      getModule().synchronizeAccountContacts(user, account);
    });

    it('should reject if it fails to get importer options', function(done) {
      var e = new Error('Options error');
      registryMock = {
        get: function() {
          return { lib: { importer: function() {} }};
        }
      };
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q.reject(e);
          }
        };
      });
      getModule().synchronizeAccountContacts(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should reject if it fails to initialize address book', function(done) {
      var e = new Error('initialoze error');
      registryMock = {
        get: function() {
          return { lib: { importer: function() {} }};
        }
      };
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q({});
          },
          initializeAddressBook: function() {
            return q.reject(e);
          }
        };
      });
      getModule().synchronizeAccountContacts(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should clean outdated contacts', function(done) {
      var contactSyncTimeStamp;
      var options = {
        account: account,
        user: user
      };
      var addressbook = {
        id: '1',
        name: 'MyAB'
      };

      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q(options);
          },
          initializeAddressBook: function(options) {
            options.addressbook = addressbook;
            return q(options);
          },
          cleanOutdatedContacts: function(options, timestamp) {
            expect(options).to.eql({
              account: account,
              user: user,
              addressbook: addressbook
            });
            expect(timestamp).to.be.a('number');
            expect(contactSyncTimeStamp < timestamp).is.true;
            done();
          }
        };
      });
      registryMock = {
        get: function() {
          return {
            lib: {
              importer: {
                importContact: function() {
                  return q.resolve();
                }
              }
            }
          };
        }
      };
      contactSyncTimeStamp = Date.now();
      getModule().synchronizeAccountContacts(user, account);
    });

    it('should pubsub contacts:contact:delete event for removed contacts', function(done) {
      var options = {
        account: account,
        user: user
      };
      var addressbook = {
        id: '1',
        name: 'MyAB'
      };

      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q(options);
          },
          initializeAddressBook: function(options) {
            options.addressbook = addressbook;
            return q(options);
          },
          cleanOutdatedContacts: function() {
            return q.resolve([{
              cardId: '1',
              data: 'data'
            }, {
              cardId: '2',
              error: new Error('Cannot delete this contact')
            }, {
              cardId: '3',
              data: 'data'
            }]);
          }
        };
      });
      registryMock = {
        get: function() {
          return {
            lib: {
              importer: {
                importContact: function() {
                  return q.resolve();
                }
              }
            }
          };
        }
      };
      var publishSpy = sinon.spy();
      pubsubMock.global.topic = function(topic) {
        expect(topic).to.equal('contacts:contact:delete');
        return {
          publish: publishSpy
        };
      };
      getModule().synchronizeAccountContacts(user, account).then(function() {
        expect(publishSpy.callCount).to.equal(2);
        expect(publishSpy).to.have.been.calledWith({
          contactId: '1',
          bookId: user._id,
          bookName: addressbook.id
        });
        expect(publishSpy).to.have.been.calledWith({
          contactId: '3',
          bookId: user._id,
          bookName: addressbook.id
        });
        done();
      });

    });

  });

  describe('The importAccountContactsByJobQueue function', function() {

    it('should call jobqueue submitJob fn with valid options', function(done) {

      var options = {
        account: account,
        user: user
      };
      var addressbook = {
        id: '1',
        name: 'MyAB'
      };

      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q(options);
          },
          initializeAddressBook: function(options) {
            options.addressbook = addressbook;
            return q(options);
          }
        };
      });

      jobQueueMock.lib.submitJob = function(workerName, jobName, options) {
        expect(workerName).to.equal('contact-' + account.data.provider + '-import');
        expect(options).to.eql({
          user: user,
          account: account
        });
        done();
      };

      getModule().importAccountContactsByJobQueue(user, account);
    });

    it('should resolve if jobqueue submitJob resolves', function(done) {
      var options = {
        account: account,
        user: user
      };
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q({});
          },
          initializeAddressBook: function() {
            return q(options);
          }
        };
      });

      jobQueueMock.lib.submitJob = function() {return q({});};
      getModule().importAccountContactsByJobQueue(user, account).then(function() {
        done();
      });
    });
  });

  describe('The synchronizeAccountContactsByJobQueue function', function() {

    it('should call jobqueue submitJob fn with valid options', function(done) {

      var options = {
        account: account,
        user: user
      };
      var addressbook = {
        id: '1',
        name: 'MyAB'
      };

      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q(options);
          },
          initializeAddressBook: function(options) {
            options.addressbook = addressbook;
            return q(options);
          }
        };
      });

      jobQueueMock.lib.submitJob = function(workerName, jobName, options) {
        expect(workerName).to.equal('contact-' + account.data.provider + '-sync');
        expect(options).to.eql({
          user: user,
          account: account
        });
        done();
      };

      getModule().synchronizeAccountContactsByJobQueue(user, account);
    });

    it('should resolve if jobqueue submitJob resolves', function(done) {
      var options = {
        account: account,
        user: user
      };
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q({});
          },
          initializeAddressBook: function() {
            return q(options);
          }
        };
      });

      jobQueueMock.lib.submitJob = function() {return q({});};
      getModule().synchronizeAccountContactsByJobQueue(user, account).then(function() {
        done();
      });
    });
  });

  describe('The createContact fn', function() {
    var vcardMock, optionsMock, vcarJson;
    var error = new Error('an error');
    beforeEach(function() {
      vcarJson = { uid: 1 };
      vcardMock = {
        getFirstPropertyValue: function() { return 1; },
        toJSON: function() { return vcarJson; }
      };
      optionsMock = {
        addressbook: {
          id: 1234
        },
        account: {
          type: 'oauth',
          data: {
            username: 'linagora',
            provider: 'twitter',
            token: 456,
            token_secret: 'abc'
          }
        },
        esnToken: 123,
        user: {
          _id: 'myId',
          accounts: [
            {
              type: 'oauth',
              data: {
                provider: 'twitter',
                token: 456,
                token_secret: 'abc'
              }
            }
          ]
        }
      };
    });

    it('should reject IMPORT_CONTACT_CLIENT_ERROR error when contact client reject', function(done) {

      contactClientMock.create = function() {
        return q.reject(error);
      };
      getModule().createContact(vcardMock, optionsMock).then(null, function(err) {
        expect(err).to.deep.equal({
          type: 'contact:import:contact:error',
          errorObject: error
        });
        done();
      });
    });

    it('should publish correct object when contact client resolve', function(done) {
      contactClientMock.create = function() {
        return q.resolve({});
      };
      deps.pubsub.global.topic = function(topic) {
        expect(topic).to.equal('contacts:contact:add');
        return {
          publish: function(data) {
            expect(data).to.deep.eql({
              contactId: vcarJson.uid,
              bookHome: optionsMock.user._id,
              bookName: optionsMock.addressbook.id,
              bookId: optionsMock.user._id,
              vcard: vcarJson,
              user: { _id: optionsMock.user._id }
            });
            done();
          }
        };
      };
      getModule().createContact(vcardMock, optionsMock);
    });
  });

  describe('The buildErrorMessage fn', function() {
    var error, type;
    var CONTACT_IMPORT_ERROR = require('../../../backend/constants').CONTACT_IMPORT_ERROR;

    beforeEach(function() {
      error = { statusCode: 400 };
      type = 'type';
    });

    it('should build correct error object', function() {

      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: type,
        errorObject: error
      });

      type = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
        errorObject: error
      });

      error.statusCode = 500;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: type,
        errorObject: error
      });

      error.statusCode = 401;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
        errorObject: error
      });

      error.statusCode = 403;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
        errorObject: error
      });
    });
  });
});
