'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/james module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/james');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when there is no url property', () => {
      config = {};

      expect(validator(config)).to.equal('should have required property \'url\'');
    });

    it('should return error message when url is not uri format', () => {
      config = { url: 'not-uri' };

      expect(validator(config)).to.equal('.url: should match format "uri"');
    });
  });
});
