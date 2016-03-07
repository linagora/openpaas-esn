'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
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

  var jobQueueMock, pubsubMock;

  var type = 'twitter';
  var id = 123;
  var domainId = 456;

  beforeEach(function() {
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
      pubsub: pubsubMock
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
    var cronMock;

    beforeEach(function() {
      cronMock = {
        init: function() {}
      };
      mockery.registerMock('./cron', function() {
        return cronMock;
      });
      mockery.registerMock('./import', function() {
      });
    });

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

    it('should add contact sync worker and contact import worker to job queue', function(done) {

      var importer = {
        name: 'twitter',
        frontend: {
          modules: ['app.js', 'services.js'],
          moduleName: 'linagora.esn.contact.import.twitter',
          staticPath: '/foo/bar/baz/twitter'
        }
      };
      var workers = [];
      jobQueueMock.lib.workers.add = function(worker) {
        workers.push(worker);
      };

      getModule().addImporter(importer);

      expect(workers).to.shallowDeepEqual([{
        name: 'contact-' + importer.name + '-sync',
        getWorkerFunction: function() {}
      }, {
        name: 'contact-' + importer.name + '-import',
        getWorkerFunction: function() {}
      }
      ]);
      done();

    });

  });
});
