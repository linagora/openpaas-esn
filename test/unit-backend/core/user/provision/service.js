const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The user provision service module', function() {
  let logger, Service, Provider;

  beforeEach(function() {
    logger = {
      error: sinon.spy(),
      info: sinon.spy(),
      debug: sinon.spy()
    };
    mockery.registerMock('../logger', logger);
    Service = this.helpers.requireBackend('core/user/provision/service');
    Provider = this.helpers.requireBackend('core/user/provision/provider');
  });

  describe('The addProvider function', function() {
    it('should throw Error when provider is undefined', function() {
      const service = new Service();

      expect(service.addProvider).to.throw(/Wrong definition of a provider/);
    });

    it('should throw Error when a provider with similar name already exposts', function() {
      const service = new Service();
      const provider1 = new Provider('foo', () => {}, () => {});
      const provider2 = new Provider('foo', () => {}, () => {});

      service.addProvider(provider1);

      function test() {
        service.addProvider(provider2);

      }
      expect(test).to.throw(/A provider with the name of foo already exists/);
    });

    it('should add the provider to the resolvers', function() {
      const service = new Service();
      const provider = new Provider('foobar', () => {}, () => {});

      service.addProvider(provider);

      expect(service.providers.get('foobar')).to.deep.equal(provider);
    });
  });
});
