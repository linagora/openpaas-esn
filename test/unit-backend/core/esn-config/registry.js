const expect = require('chai').expect;

describe('The core/esn-config/registry module', function() {
  let registry;
  const moduleConfig = {
    rights: {
      admin: 'rw',
      user: 'r'
    },
    configurations: {}
  };
  const moduleName = 'sample-module';

  beforeEach(function() {
    registry = this.helpers.requireBackend('core/esn-config/registry');
  });

  describe('The getFromModule method', function() {
    it('should return config data of a given module', function() {
      registry.register(moduleName, moduleConfig);

      expect(registry.getFromModule(moduleName)).to.deep.equal(moduleConfig);
    });
  });

  describe('The register method', function() {
    it('should add new module config to registry data', function() {
      registry.register(moduleName, moduleConfig);

      expect(registry.getFromModule(moduleName)).to.equal(moduleConfig);
    });
  });

  describe('The registerToModule method', function() {
    it('should register a config to a given module', function() {
      const subconfig = 'example';

      registry.register(moduleName, moduleConfig);
      registry.registerToModule(moduleName, subconfig, {});

      expect(registry.getFromModule(moduleName).configurations).to.have.property(subconfig);
    });
  });
});
