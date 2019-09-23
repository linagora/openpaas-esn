const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The synchronize worker', function() {
  let getModule;

  const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../../../../../backend/lib/domain-members/contants');

  beforeEach(function() {
    mockery.registerMock('../helper', () => ({}));

    getModule = () => require('../../../../../backend/lib/domain-members/workers/synchronize')(this.moduleHelpers.dependencies);
  });

  it('should return correct worker name', function() {
    expect(getModule().name).to.equal(DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME);
  });

  describe('The handle method', function() {
    let esnConfigMock;
    let getHandleMethod;

    const domainId = '123';
    const job = {
      data: { domainId }
    };

    beforeEach(function() {
      esnConfigMock = {
        inModule: function() {
          return esnConfigMock;
        },
        esnConfig: {
          setDomainId: function() {
            return esnConfigMock;
          }
        },
        get: () => Promise.resolve({
          isDomainMembersAddressbookEnabled: true
        })
      };

      this.moduleHelpers.addDep('esn-config', () => esnConfigMock);

      getHandleMethod = () => getModule().handler.handle;
    });

    it('should reject if failed to get feature status', function(done) {
      esnConfigMock.get = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(esnConfigMock.get).to.have.been.calledOnce;
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if the domain member address book is disabled', function(done) {
      esnConfigMock.get = sinon.stub().returns(Promise.resolve({
        isDomainMembersAddressbookEnabled: false
      }));

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(esnConfigMock.get).to.have.been.calledOnce;
          expect(err.message).to.equal(`Can not synchronize domain member address book for domain ${domainId} due to the feature is disabled`);
          done();
        });
    });

    it('should reject if failed to synchronize domain member address book', function(done) {
      const synchronizeMock = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      mockery.registerMock('../synchronize', () => synchronizeMock);

      getHandleMethod()(job)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(synchronizeMock).to.have.been.calledOnce;
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve if the success to synchronize contacts', function(done) {
      const synchronizeMock = sinon.stub().returns(Promise.resolve());

      mockery.registerMock('../synchronize', () => synchronizeMock);

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
