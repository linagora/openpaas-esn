'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/elasticsearch module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/elasticsearch');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        host: 'http://localhost:8001'
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when there is no host property', () => {
      delete config.host;

      expect(validator(config)).to.equal('should have required property \'host\'');
    });

    it('should return error message when host is not uri', () => {
      config.host = 'noturi';

      expect(validator(config)).to.equal('.host: should match format "uri"');
    });
  });
});
