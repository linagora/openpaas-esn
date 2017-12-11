'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/web module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/web');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        base_url: 'http://localhost:8001'
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when there is no base_url', () => {
      delete config.base_url;

      expect(validator(config)).to.equal('should have required property \'base_url\'');
    });

    it('should return error message when base_url is not a uri', () => {
      config.base_url = 'not a uri';

      expect(validator(config)).to.equal('.base_url: should match format "uri"');
    });
  });
});
