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
      startJob: function() {}
    }
  };

  var type = 'twitter';
  var id = 123;
  var domainId = 456;

  beforeEach(function() {
    deps = {
      logger: {
        debug: console.log,
        info: console.log,
        error: console.log
      },
      jobqueue: jobQueueMock
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
  });

  describe('The importAccountContacts function', function() {

    it('should reject if account is not found', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function(type) {
            expect(type).to.equals(account.data.provider);
            return null;
          }
        };
      });
      getModule().importAccountContacts(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find importer ' + account.data.provider);
        done();
      });
    });

    it('should call importer with valid options', function(done) {

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
      mockery.registerMock('./importers', function() {
        return {
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
      });
      getModule().importAccountContacts(user, account);
    });

    it('should reject if importer is undefined', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function(type) {
            expect(type).to.equals(account.data.provider);
            return null;
          }
        };
      });
      getModule().importAccountContacts(user, account).then(done, function() {
        done();
      });
    });

    it('should reject if importer.lib is undefined', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function(type) {
            expect(type).to.equals(account.data.provider);
            return {};
          }
        };
      });
      getModule().importAccountContacts(user, account).then(done, function() {
        done();
      });
    });
  });

  describe('The importAccountContactsByJobQueue function', function() {

    it('should reject if helper.getImporterOptions rejects', function(done) {
      var e = new Error('Options error');
      mockery.registerMock('./helper', function() {
        return {
          getImporterOptions: function() {
            return q.reject(e);
          },
          initializeAddressBook: function() {
            return q({});
          }
        };
      });
      getModule().importAccountContactsByJobQueue(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

    it('should reject if helper.initializeAddressBook rejects', function(done) {
      var e = new Error('initialoze error');
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
      getModule().importAccountContactsByJobQueue(user, account).then(done, function(err) {
        expect(err).to.equal(e);
        done();
      });
    });

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
        expect(jobName).to.deep.equals('contact-' + account.data.provider + '-import');
        expect(options.account).to.deep.equals(account);
        expect(options.user).to.deep.equals(user);
        expect(options.addressbook).to.deep.equals(addressbook);
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
