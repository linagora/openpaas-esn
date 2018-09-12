'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/membersCanBeSearched module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/membersCanBeSearched');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not type of boolean', () => {
      config = '';

      expect(validator(config)).to.equal('should be boolean');
    });
  });
});
