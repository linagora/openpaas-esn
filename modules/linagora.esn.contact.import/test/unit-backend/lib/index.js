'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');
var chai = require('chai');
var expect = chai.expect;

describe('The contact import backend module', function() {

  var deps;

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../backend/lib/index')(dependencies);
  };

  var type = 'twitter';
  var id = 123;
  var user = {
    accounts: [
      {
        data: {
          provider: type,
          id: id
        }
      },
      {
        data: {
          provider: 'test',
          id: id
        }
      }
    ]
  };

  beforeEach(function() {
    deps = {
      logger: {
        debug: console.log,
        info: console.log,
        error: console.log
      }
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

  describe('The importContacts function', function() {

    it('should reject if account is not found', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function() {
            return null;
          }
        };
      });
      getModule().importContacts({user: {accounts: []}, accountId: id, type: type}).then(done, function() {
        done();
      });
    });

    it('should call with the matching account', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function() {
            return {
              lib: {
                importer: {
                  importContact: function(options) {
                    expect(options.account).to.deep.equals(user.accounts[0]);
                    done();
                    return q({});
                  }
                }
              }
            };
          }
        };
      });
      getModule().importContacts({user: user, accountId: id, type: type});
    });

    it('should reject if importer is undefined', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function(type) {
            return null;
          }
        };
      });
      getModule().importContacts({user: user, accountId: id, type: type}).then(done, function() {
        done();
      });
    });

    it('should reject if importer.lib is undefined', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function() {
            return {};
          }
        };
      });
      getModule().importContacts({user: user, accountId: id, type: type}).then(done, function() {
        done();
      });
    });

    it('should resolve if importer.importContact resolves', function(done) {
      mockery.registerMock('./importers', function() {
        return {
          get: function() {
            return {
              lib: {
                importer: {
                  importContact: function() {
                    return q.when({});
                  }
                }
              }
            };
          }
        };
      });
      getModule().importContacts({user: user, accountId: id, type: type}).then(function() {
        done();
      }, done);
    });
  });
});
