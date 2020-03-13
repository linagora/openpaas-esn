const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The user metadata module', function() {
  let userMetadata, get, set;

  beforeEach(function() {
    const self = this;

    get = () => Promise.resolve();
    set = () => Promise.resolve();

    mockery.registerMock('../esn-config', () => ({
      forUser: () => ({ get, set })
    }));

    userMetadata = self.helpers.requireBackend('core/user/metadata');
  });

  describe('The get function', () => {
    it('should get value matching a key userMetadata configuration', function(done) {
      get = sinon.stub().returns(Promise.resolve());

      userMetadata({}).get('blockedProfileFields')
        .then(() => {
          expect(get).to.have.been.calledWith('blockedProfileFields');
          done();
        })
        .catch(done);
    });
  });

  describe('The set function', () => {
    it('should set value to a key in userMetadata configuration', function(done) {
      set = sinon.stub().returns(Promise.resolve());

      userMetadata({}).set('blockedProfileFields', ['firstname'])
        .then(() => {
          expect(set).to.have.been.calledWith('blockedProfileFields', ['firstname']);
          done();
        })
        .catch(done);
    });
  });
});
