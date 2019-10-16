const { expect } = require('chai');

describe('The domain members address book, utils module', () => {
  let getModule, jobQueueModuleMock, coreTechnicalUserMock;

  beforeEach(function() {
    jobQueueModuleMock = {
      lib: {
        submitJob: () => {}
      }
    };
    coreTechnicalUserMock = {
      findByTypeAndDomain: () => {},
      getNewToken: () => {}
    };

    this.moduleHelpers.addDep('technical-user', coreTechnicalUserMock);
    this.moduleHelpers.addDep('jobqueue', jobQueueModuleMock);
    this.moduleHelpers.addDep('esn-config', {
      EsnConfig: function() {}
    });

    getModule = () => require('../../../../backend/lib/domain-members/utils')(this.moduleHelpers.dependencies);
  });

  describe('The getTechnicalUser function', () => {
    it('should reject if failed to get technical user', function(done) {
      coreTechnicalUserMock.findByTypeAndDomain = (type, domainId, callback) => callback(new Error('something wrong'));

      getModule().getTechnicalUser('123')
        .then(
          () => done(new Error('should not resolve')),
          err => {
            expect(err.message).to.equal('something wrong');
            done();
          }
        )
        .catch(done);
    });

    it('should reject if there is no technical user found on the domain', function(done) {
      coreTechnicalUserMock.findByTypeAndDomain = (type, domainId, callback) => callback();

      getModule().getTechnicalUser('123')
        .then(
          () => done(new Error('should not resolve')),
          err => {
            expect(err.message).to.equal('No technical user found for domain 123');
            done();
          }
        )
        .catch(done);
    });
  });
});
