'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/homepage module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/homepage');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not a string', () => {
      config = [];

      expect(validator(config)).to.equal('should be string');

      config = '';

      expect(validator(config)).to.equal('should NOT be shorter than 1 characters');
    });
  });
});
