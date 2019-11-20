const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The synchronize worker', function() {
  let getModule, utilsMock, synchronizeMock, addressbookMock, options;

  const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../../../../../backend/lib/domain-members/contants');

  beforeEach(function() {
    const isEnabled = true;

    const jobQueueModuleMock = {
      lib: {
        submitJob: () => Promise.resolve()
      }
    };

    utilsMock = {
      isFeatureEnabled: () => Promise.resolve(isEnabled)
    };

    options = {};

    addressbookMock = {
      createDomainMembersAddressbook: () => Promise.resolve(),
      getDomainMembersAddressbook: () => Promise.resolve(),
      getClientOptionsForDomain: () => Promise.resolve(options),
      removeDomainMembersAddressbook: () => Promise.resolve()
    };

    mockery.registerMock('../helper', () => ({}));
    mockery.registerMock('../utils', () => utilsMock);
    mockery.registerMock('../synchronize', () => synchronizeMock);
    mockery.registerMock('../addressbook', () => addressbookMock);

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

    it('should reject if failed to get contact client options', function(done) {
      addressbookMock.getClientOptionsForDomain = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(addressbookMock.getClientOptionsForDomain).to.have.been.calledWith(domainId);
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if failed to get domain members address book', function(done) {
      addressbookMock.getDomainMembersAddressbook = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(addressbookMock.getDomainMembersAddressbook).to.have.been.calledWith(domainId);
          expect(err.message).to.equal('something wrong');
          done();
        });
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

    describe('The domain members address book feature is disabled', function() {
      beforeEach(function() {
        utilsMock.isFeatureEnabled = () => Promise.resolve(false);
      });

      it('should remove domain members address book if the address book exists', function(done) {
        addressbookMock.getDomainMembersAddressbook = () => Promise.resolve({ foo: 'bar' });
        addressbookMock.removeDomainMembersAddressbook = sinon.stub().returns(Promise.resolve());

        getHandleMethod()(job)
          .then(() => {
            expect(addressbookMock.removeDomainMembersAddressbook).to.have.been.calledWith(domainId, options);
            done();
          })
          .catch(done);
      });

      it('should do nothing if the address book does not exist', function(done) {
        addressbookMock.getDomainMembersAddressbook = () => Promise.resolve();
        addressbookMock.removeDomainMembersAddressbook = sinon.spy();

        getHandleMethod()(job)
          .then(() => {
            expect(addressbookMock.removeDomainMembersAddressbook).to.not.have.been.called;
            done();
          })
          .catch(done);
      });
    });

    describe('The domain members address book feature is enabled', function() {
      beforeEach(function() {
        utilsMock.isFeatureEnabled = () => Promise.resolve(true);
        addressbookMock.createDomainMembersAddressbook = sinon.stub().returns(Promise.resolve());
      });

      it('should create domain members address book and synchronize contacts if the address book does not exist', function(done) {
        addressbookMock.getDomainMembersAddressbook = () => Promise.resolve();
        synchronizeMock = sinon.stub().returns(Promise.resolve());

        getHandleMethod()(job)
          .then(() => {
            expect(addressbookMock.createDomainMembersAddressbook).to.have.been.calledWith(domainId, options);
            expect(synchronizeMock).to.have.been.calledWith(domainId);
            done();
          })
          .catch(done);
      });

      it('should synchronize contacts for domain members address book if the address book exists and force is set to true', function(done) {
        addressbookMock.getDomainMembersAddressbook = () => Promise.resolve({ foo: 'bar' });
        synchronizeMock = sinon.stub().returns(Promise.resolve());
        job.data.force = true;

        getHandleMethod()(job)
          .then(() => {
            expect(addressbookMock.createDomainMembersAddressbook).to.not.have.been.called;
            expect(synchronizeMock).to.have.been.calledWith(domainId);
            done();
          })
          .catch(done);
      });

      it('should do nothing if the address book exists but force is set to false', function(done) {
        addressbookMock.getDomainMembersAddressbook = () => Promise.resolve({ foo: 'bar' });
        synchronizeMock = sinon.stub().returns(Promise.resolve());
        job.data.force = false;

        getHandleMethod()(job)
          .then(() => {
            expect(addressbookMock.createDomainMembersAddressbook).to.not.have.been.called;
            expect(synchronizeMock).to.not.have.been.called;
            done();
          })
          .catch(done);
      });
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
