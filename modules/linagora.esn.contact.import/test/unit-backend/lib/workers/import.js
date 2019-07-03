const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The import worker', function() {
  let getModule;

  const { IMPORT } = require('../../../../backend/lib/constants').JOBQUEUE_WORKER_NAMES;

  beforeEach(function() {
    mockery.registerMock('../helper', () => ({}));

    getModule = () => require('../../../../backend/lib/workers/import')(this.moduleHelpers.dependencies);
  });

  it('should return correct worker name', function() {
    expect(getModule().name).to.equal(IMPORT);
  });

  describe('The handle method', function() {
    let getHandleMethod, importerRegistryMock, helperMock;

    beforeEach(function() {
      getHandleMethod = () => getModule().handler.handle;

      importerRegistryMock = {};
      helperMock = {};

      mockery.registerMock('../registry', () => importerRegistryMock);
      mockery.registerMock('../helper', () => helperMock);
    });

    it('should reject if there is no registered importer', function(done) {
      const provider = 'foo';
      const job = {
        data: {
          account: {
            data: { provider }
          }
        }
      };

      importerRegistryMock.get = sinon.stub().returns();

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(importerRegistryMock.get).to.have.been.calledWith(provider);
          expect(err.message).to.equal(`Can not find importer ${provider}`);
          done();
        });
    });

    it('should reject if the registered importer does not have lib', function(done) {
      const provider = 'foo';
      const job = {
        data: {
          account: {
            data: { provider }
          }
        }
      };

      importerRegistryMock.get = sinon.stub().returns({});

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(importerRegistryMock.get).to.have.been.calledWith(provider);
          expect(err.message).to.equal(`Can not find importer ${provider}`);
          done();
        });
    });

    it('should reject if the registered importer does not have lib.importer', function(done) {
      const provider = 'foo';
      const job = {
        data: {
          account: {
            data: { provider }
          }
        }
      };

      importerRegistryMock.get = sinon.stub().returns({ lib: {} });

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(importerRegistryMock.get).to.have.been.calledWith(provider);
          expect(err.message).to.equal(`Can not find importer ${provider}`);
          done();
        });
    });

    it('should reject if the failed to get importer options', function(done) {
      const job = {
        data: {
          user: { bar: 'bar' },
          account: {
            data: { provider: 'foo' }
          }
        }
      };

      importerRegistryMock.get = () => ({ lib: { importer: {} } });
      helperMock.getImporterOptions = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(helperMock.getImporterOptions).to.have.been.calledWith(job.data.user, job.data.account);
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if the failed to initialize address book', function(done) {
      const job = {
        data: {
          user: { bar: 'bar' },
          account: {
            data: { provider: 'foo' }
          }
        }
      };
      const options = { foo: 'bar' };

      importerRegistryMock.get = () => ({ lib: { importer: {} } });
      helperMock.getImporterOptions = () => Promise.resolve(options);
      helperMock.initializeAddressBook = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(helperMock.initializeAddressBook).to.have.been.calledWith(options);
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if the failed to import contacts', function(done) {
      const job = {
        data: {
          user: { bar: 'bar' },
          account: {
            data: { provider: 'foo' }
          }
        }
      };
      const options = { foo: 'bar' };
      const importContactMock = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      importerRegistryMock.get = () => ({ lib: { importer: { importContact: importContactMock } } });
      helperMock.getImporterOptions = () => Promise.resolve();
      helperMock.initializeAddressBook = () => Promise.resolve(options);

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(importContactMock).to.have.been.calledWith(options);
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve if the success to import contacts', function(done) {
      const job = {
        data: {
          user: { bar: 'bar' },
          account: {
            data: { provider: 'foo' }
          }
        }
      };
      const options = { foo: 'bar' };
      const importContactMock = sinon.stub().returns(Promise.resolve());

      importerRegistryMock.get = () => ({ lib: { importer: { importContact: importContactMock } } });
      helperMock.getImporterOptions = () => Promise.resolve();
      helperMock.initializeAddressBook = () => Promise.resolve(options);

      getHandleMethod()(job)
        .then(() => {
          expect(importContactMock).to.have.been.calledWith(options);
          done();
        })
        .catch(done);
    });
  });

  describe('The getTitle method', function() {
    it('should build the correct title', function() {
      const jobData = {
        user: { _id: 'bar' },
        account: {
          data: { provider: 'foo' }
        }
      };

      expect(getModule().handler.getTitle(jobData)).to.equal(`Import ${jobData.account.data.provider} contacts for user ${jobData.user._id}`);
    });
  });
});
