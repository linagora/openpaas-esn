const mockery = require('mockery');
const sinon = require('sinon');
const { expect } = require('chai');

describe('The contact import backend module', function() {
  let getModule;
  let jobQueueMock, webserverWrapperMock, cronMock, importerRegistryMock;

  beforeEach(function() {
    jobQueueMock = {
      lib: {
        addWorker: () => {},
        workers: {
          add: () => {}
        }
      }
    };

    cronMock = {
      init: () => {}
    };

    webserverWrapperMock = {
      injectAngularModules: () => {},
      addApp: () => {}
    };

    importerRegistryMock = {
      add: () => {}
    };

    this.moduleHelpers.addDep('jobqueue', jobQueueMock);
    this.moduleHelpers.addDep('webserver-wrapper', webserverWrapperMock);

    getModule = () => require('../../../backend/lib/index')(this.moduleHelpers.dependencies);
    mockery.registerMock('./cron', () => cronMock);
    mockery.registerMock('./import', () => {});
    mockery.registerMock('./registry', () => importerRegistryMock);
    mockery.registerMock('./workers/import', () => {});
    mockery.registerMock('./workers/synchronize', () => {});
  });

  describe('The init method', function() {
    it('should init cron', function() {
      cronMock.init = sinon.spy();

      getModule().init();

      expect(cronMock.init).to.have.been.calledOnce;
    });

    it('should add import contacts worker', function() {
      const importWorker = { foo: 'bar' };

      mockery.registerMock('./workers/import', () => importWorker);
      jobQueueMock.lib.addWorker = sinon.spy();

      getModule().init();

      expect(jobQueueMock.lib.addWorker).to.have.been.calledWith(importWorker);
    });

    it('should add synchronize contacts worker', function() {
      const synchronizeWorker = { foo: 'bar' };

      mockery.registerMock('./workers/synchronize', () => synchronizeWorker);
      jobQueueMock.lib.addWorker = sinon.spy();

      getModule().init();

      expect(jobQueueMock.lib.addWorker).to.have.been.calledWith(synchronizeWorker);
    });
  });

  describe('The addImporter function', function() {
    it('should not add importer when there is no importer', function() {
      importerRegistryMock.add = sinon.spy();

      getModule().addImporter();
      expect(importerRegistryMock.add).to.not.have.been.called;
    });

    it('should not create a webapp when there is no importer', function() {
      const getStaticAppSpy = sinon.spy();

      mockery.registerMock('../webserver', function() {
        return {
          getStaticApp: getStaticAppSpy
        };
      });

      webserverWrapperMock.injectAngularModules = sinon.spy();
      webserverWrapperMock.addApp = sinon.spy();

      getModule().addImporter();
      expect(getStaticAppSpy).to.not.have.been.called;
      expect(webserverWrapperMock.injectAngularModules).to.not.have.been.called;
      expect(webserverWrapperMock.addApp).to.not.have.been.called;
    });

    it('should add importer when importer is defined', function() {
      const importer = {
        name: 'twitter',
        frontend: {
          modules: ['app.js', 'services.js'],
          moduleName: 'linagora.esn.contact.import.twitter',
          staticPath: '/foo/bar/baz/twitter'
        }
      };

      importerRegistryMock.add = sinon.spy();

      getModule().addImporter(importer);
      expect(importerRegistryMock.add).to.have.been.calledWith(importer);
    });

    it('should create a webapp when importer is defined', function() {
      const getStaticAppSpy = sinon.spy();
      const importer = {
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

      webserverWrapperMock.injectAngularModules = sinon.spy();
      webserverWrapperMock.addApp = sinon.spy();

      getModule().addImporter(importer);
      expect(getStaticAppSpy).to.have.been.calledOnce;
      expect(webserverWrapperMock.injectAngularModules).to.have.been.calledOnce;
      expect(webserverWrapperMock.addApp).to.have.been.calledOnce;
    });
  });
});
