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

  var type = 'twitter';
  var id = 123;
  var domainId = 456;

  var technicalUser = {
    findByTypeAndDomain: function(type, domain, callback) {
      callback(null, [{_id: 1}, {_id: 2}]);
    },
    getNewToken: function(user, ttl, callback) {
      callback(null, {token: 123});
    }
  };

  beforeEach(function() {
    deps = {
      logger: {
        debug: console.log,
        info: console.log,
        error: console.log
      }
    };

    account =  {
      data: {
        provider: type,
        id: id
      }
    };
    user = {
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

    it('should call with the matching account', function(done) {
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
                    done();
                    return q({});
                  }
                }
              }
            };
          }
        };
      });
      deps['technical-user'] = technicalUser;

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
      deps['technical-user'] = technicalUser;
      getModule().importAccountContacts(user, account).then(done, function() {
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
      deps['technical-user'] = technicalUser;
      getModule().importAccountContacts(user, account).then(function() {
        done();
      }, done);
    });
  });

  describe('The getImporterOptions function', function() {

    it('should reject if technicalUser.findByTypeAndDomain fails', function(done) {
      var err = new Error('I failed!');
      technicalUser.findByTypeAndDomain = function(type, domain, callback) {
        return callback(err);
      };
      deps['technical-user'] = technicalUser;

      getModule().getImporterOptions(user, account).then(done, function(e) {
        expect(e).to.deep.equal(err);
        done();
      });
    });

    it('should reject if technicalUser.findByTypeAndDomain does not send back users', function(done) {
      technicalUser.findByTypeAndDomain = function(type, domain, callback) {
        return callback();
      };
      deps['technical-user'] = technicalUser;

      getModule().getImporterOptions(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find technical user for contact import');
        done();
      });
    });

    it('should reject if technicalUser.findByTypeAndDomain sends back empty user array', function(done) {
      technicalUser.findByTypeAndDomain = function(type, domain, callback) {
        return callback(null, []);
      };
      deps['technical-user'] = technicalUser;

      getModule().getImporterOptions(user, account).then(done, function(err) {
        expect(err.message).to.equal('Can not find technical user for contact import');
        done();
      });
    });

    it('should reject if technicalUser.getNewToken fails', function(done) {
      var err = new Error('I failed!');
      technicalUser.findByTypeAndDomain = function(type, domain, callback) {
        return callback(null, [{}]);
      };
      technicalUser.getNewToken = function(user, ttl, callback) {
        callback(err);
      };
      deps['technical-user'] = technicalUser;

      getModule().getImporterOptions(user, account).then(done, function(e) {
        expect(e).to.deep.equal(err);
        done();
      });
    });

    it('should reject if technicalUser.getNewToken does not return a token', function(done) {
      technicalUser.findByTypeAndDomain = function(type, domain, callback) {
        return callback(null, [{}]);
      };
      technicalUser.getNewToken = function(user, ttl, callback) {
        callback();
      };
      deps['technical-user'] = technicalUser;

      getModule().getImporterOptions(user, account).then(done, function(e) {
        expect(e.message).to.equal('Can not generate token for contact import');
        done();
      });
    });

    it('should resolve with valid options', function(done) {
      var token = {_id: 123456789, token: 'MyToken'};
      technicalUser.findByTypeAndDomain = function(type, domain, callback) {
        return callback(null, [{}]);
      };
      technicalUser.getNewToken = function(user, ttl, callback) {
        callback(null, token);
      };
      deps['technical-user'] = technicalUser;

      getModule().getImporterOptions(user, account).then(function(options) {
        expect(options.account).to.deep.equal(account);
        expect(options.user).to.deep.equal(user);
        expect(options.esnToken).to.deep.equal(token.token);
        done();
      }, done);
    });
  });
});
