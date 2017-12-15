'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/davserver module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/davserver');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        frontend: {
          url: 'http://localhost:8001'
        },
        backend: {
          url: 'http://localhost:8001'
        }
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when there is no frontend', () => {
      delete config.frontend;

      expect(validator(config)).to.equal('should have required property \'frontend\'');
    });

    it('should return error message when there is no backend', () => {
      delete config.backend;

      expect(validator(config)).to.equal('should have required property \'backend\'');
    });

    it('should return error message when frontend does not have url property', () => {
      delete config.frontend.url;

      expect(validator(config)).to.equal('.frontend: should have required property \'url\'');
    });

    it('should return error message when backend does not have url property', () => {
      delete config.backend.url;

      expect(validator(config)).to.equal('.backend: should have required property \'url\'');
    });

    it('should return error message when frontend.url is not uri', () => {
      config.frontend.url = 'noturi';

      expect(validator(config)).to.equal('.frontend.url: should match format "uri"');
    });

    it('should return error message when backend.url is not uri', () => {
      config.backend.url = 'noturi';

      expect(validator(config)).to.equal('.backend.url: should match format "uri"');
    });
  });
});
