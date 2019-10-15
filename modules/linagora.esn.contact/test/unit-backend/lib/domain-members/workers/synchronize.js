const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The synchronize worker', function() {
  let getModule, utilsMock, synchronizeMock, addressbookMock;

  const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../../../../../backend/lib/domain-members/contants');

  beforeEach(function() {
    const isEnabled = true;

    mockery.registerMock('../helper', () => ({}));
    mockery.registerMock('../utils', () => utilsMock);
    mockery.registerMock('../synchronize', () => synchronizeMock);
    mockery.registerMock('../addressbook', () => addressbookMock);

    const jobQueueModuleMock = {
      lib: {
        submitJob: () => Promise.resolve()
      }
    };

    utilsMock = {
      isFeatureEnabled: () => Promise.resolve(isEnabled)
    };

    addressbookMock = {
      createDomainMembersAddressbook: () => Promise.resolve()
    };

    this.moduleHelpers.addDep('jobqueue', jobQueueModuleMock);

    getModule = () => require('../../../../../backend/lib/domain-members/workers/synchronize')(this.moduleHelpers.dependencies);
  });

  it('should return correct worker name', function() {
    expect(getModule().name).to.equal(DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME);
  });

  describe('The handle method', function() {
    let getHandleMethod;

    const domainId = '123';
    const job = {
      data: { domainId }
    };

    beforeEach(function() {
      getHandleMethod = () => getModule().handler.handle;
    });

    it('should reject if failed to create domain members address book', function(done) {
      addressbookMock.createDomainMembersAddressbook = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(addressbookMock.createDomainMembersAddressbook).to.have.been.calledWith(domainId);
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if failed to get feature status', function(done) {
      utilsMock.isFeatureEnabled = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(utilsMock.isFeatureEnabled).to.have.been.calledOnce;
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if the domain member address book is disabled', function(done) {
      utilsMock.isFeatureEnabled = sinon.stub().returns(Promise.resolve(false));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(utilsMock.isFeatureEnabled).to.have.been.calledOnce;
          expect(err.message).to.equal(`Can not synchronize domain member address book for domain ${domainId} due to the feature is disabled`);
          done();
        });
    });

    it('should reject if failed to synchronize domain member address book', function(done) {
      synchronizeMock = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(synchronizeMock).to.have.been.calledOnce;
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve if the success to synchronize contacts', function(done) {
      synchronizeMock = sinon.stub().returns(Promise.resolve());

      getHandleMethod()(job)
        .then(() => {
          expect(synchronizeMock).to.have.been.calledOnce;
          done();
        })
        .catch(err => done(err || 'should resolve'));
    });
  });

  describe('The getTitle method', function() {
    it('should build the correct title', function() {
      const jobData = {
        domainId: '123'
      };

      expect(getModule().handler.getTitle(jobData)).to.equal(`Synchronize domain member contacts for domain ${jobData.domainId}`);
    });
  });
});
