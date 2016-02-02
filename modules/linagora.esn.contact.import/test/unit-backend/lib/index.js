'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');
var chai = require('chai');
var expect = chai.expect;

describe('The contact import backend module', function() {

  var deps, user, account;

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../backend/lib/index')(dependencies);
  };

  var jobQueueMock = {
    lib: {
      startJob: function() {},
      workers: {
        add: function() {}
      }
    }
  };

  var type = 'twitter';
  var id = 123;
  var domainId = 456;

  beforeEach(function() {
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
      }
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

  describe('The addImporter function', function() {

    it('should not add importer when undefined', function() {
      var angularSpy = sinon.spy();
      var addAppSpy = sinon.spy();
      var getStaticAppSpy = sinon.spy();

      mockery.registerMock('../webserver', function() {
        return {
          getStaticApp: getStaticAppSpy
        };
      });

      deps['webserver-wrapper'] = {
        injectAngularModules: angularSpy,
        addApp: addAppSpy
      };

      getModule().addImporter();
      expect(getStaticAppSpy).to.not.have.been.called;
      expect(angularSpy).to.not.have.been.called;
      expect(addAppSpy).to.not.have.been.called;
    });

    it('should create a webapp when importer is defined', function() {

      var angularSpy = sinon.spy();
      var addAppSpy = sinon.spy();
      var getStaticAppSpy = sinon.spy();

      var importer = {
        name: 'twitter',
        frontend: {
          modules: ['app.js', 'services.js'],
          moduleName: 'linagora.esn.contact.import.twitter',
          staticPath: '/foo/bar/baz/twitter'
        }
      };

      mockery.registerMock('../webserver', function() {
        return {
          getStaticApp: getStaticAppSpy
        };
      });

      deps['webserver-wrapper'] = {
        injectAngularModules: angularSpy,
        addApp: addAppSpy
      };

      getModule().addImporter(importer);
      expect(getStaticAppSpy).to.have.been.calledOnce;
      expect(angularSpy).to.have.been.calledOnce;
      expect(addAppSpy).to.have.been.calledOnce;
    });

    it('should add contact sync worker to job queue', function(done) {

      var importer = {
        name: 'twitter',
        frontend: {
          modules: ['app.js', 'services.js'],
          moduleName: 'linagora.esn.contact.import.twitter',
          staticPath: '/foo/bar/baz/twitter'
        }
      };

      jobQueueMock.lib.workers.add = function(worker) {
        expect(worker).to.shallowDeepEqual({
          name: 'contact-' + importer.name + '-sync',
          getWorkerFunction: function() {}
        });
        done();
      };

      getModule().addImporter(importer);

    });
  });

  describe('The importAccountContacts function', function() {

    var importersMock;

    beforeEach(function() {
      importersMock = {};
      mockery.registerMock('./importers', function() {
        return importersMock;
      });
    });

    it('should reject if importer is not found', function(done) {
      importersMock = {
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
      importersMock = {
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
      importersMock = {
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
      importersMock = {
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
      importersMock = {
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
    var importersMock;

    beforeEach(function() {
      importersMock = {};
      mockery.registerMock('./importers', function() {
        return importersMock;
      });
    });

    it('should reject if importer is not found', function(done) {
      importersMock = {
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
      importersMock = {
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
      importersMock = {
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
      importersMock = {
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
      importersMock = {
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
            done();
          }
        };
      });
      importersMock = {
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
      getModule().synchronizeAccountContacts(user, account);
    });

  });

  describe('The importAccountContactsByJobQueue function', function() {

    it('should call jobqueue startJob fn with valid options', function(done) {

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

      jobQueueMock.lib.startJob = function(jobName, options) {
        expect(jobName).to.equal('contact-' + account.data.provider + '-sync');
        expect(options).to.eql({
          user: user,
          account: account
        });
        done();
      };

      getModule().importAccountContactsByJobQueue(user, account);
    });

    it('should resolve if jobqueue startJob resolves', function(done) {
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

      jobQueueMock.lib.startJob = function() {return q({});};
      getModule().importAccountContactsByJobQueue(user, account).then(function() {
        done();
      });
    });
  });
});
