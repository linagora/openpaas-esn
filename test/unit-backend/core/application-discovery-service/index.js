const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('the application discovery service module', function() {
  let configs, get, set, store;

  beforeEach(function() {
    configs = [
      {
        id: 'calendar',
        enabled: true
      },
      {
        id: 'account',
        enabled: false
      },
      {
        id: 'admin',
        enabled: false
      }
    ];

    get = sinon.stub().returns(Promise.resolve(configs));
    set = sinon.stub().returns(Promise.resolve());
    store = sinon.spy(function(configs) {
      return configs;
    });

    mockery.registerMock('../esn-config', function() {
      return {
        get,
        set,
        store,
        EsnConfig: this
      };
    });
  });

  describe('the list function', function() {
    it('should only list enabled configs', function(done) {
      const module = this.helpers.requireBackend('core/application-discovery-service');

      module.list()
        .then(configList => {
          expect(configList).to.be.defined;
          expect(configList).to.have.lengthOf(1);
          done();
        })
        .catch(done);
    });
  });

  describe('the toggleForPlatform function', function() {
    it('should toggle a config correctly', function(done) {
      const module = this.helpers.requireBackend('core/application-discovery-service');
      const toggle = {
        id: 'calendar',
        enabled: false
      };

      module.toggleForPlatform(toggle)
        .then(newConfigs => {
          expect(newConfigs).to.not.be.undefined;

          const toggledConfig = newConfigs.find(config => config.id === toggle.id);

          expect(toggledConfig.enabled).to.be.false;
          done();
        })
        .catch(done);
    });
  });

  describe('the getById function', function() {
    it('should get the desired config', function(done) {
      const module = this.helpers.requireBackend('core/application-discovery-service');

      module.getById('calendar')
        .then(config => {
          expect(config).to.not.be.undefined;
          expect(config).to.equals(configs[0]);
          done();
        })
        .catch(done);
    });
  });

  describe('the deleteById function', function() {
    it('should remove a config from the list of configs', function(done) {
      const module = this.helpers.requireBackend('core/application-discovery-service');

      module.deleteById('calendar')
        .then(configList => {
          const oldConfig = configList.find(config => config.id === 'calendar');

          expect(configList).to.not.have.lengthOf(configs.length);
          expect(oldConfig).to.be.undefined;
          done();
        })
        .catch(done);
    });
  });
});
