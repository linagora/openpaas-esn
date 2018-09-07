const expect = require('chai').expect;

describe('The core/esn-config/metadata/webserver module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/webserver');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        proxy: {
          trust: true
        }
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when there is no proxy', () => {
      delete config.proxy;

      expect(validator(config)).to.equal('should have required property \'proxy\'');
    });

    it('should return error message when proxy.trust is not a boolean', () => {
      config.proxy.trust = 'not a boolean';

      expect(validator(config)).to.equal('.proxy.trust: should be boolean');
    });
  });
});
