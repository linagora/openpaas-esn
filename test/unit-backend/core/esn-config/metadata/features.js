'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/features module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/features');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        'header:user-notification': false,
        'header:fullscreen': false,
        'control-center:password': false,
        'application-menu:jobqueue': false
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when application-menu:jobqueue property is not boolean', () => {
      config['application-menu:jobqueue'] = {};

      expect(validator(config)).to.equal('[\'application-menu:jobqueue\']: should be boolean');
    });

    it('should return error message when control-center:password property is not boolean', () => {
      config['control-center:password'] = {};

      expect(validator(config)).to.equal('[\'control-center:password\']: should be boolean');
    });

    it('should return error message when header:user-notification property is not boolean', () => {
      config['header:user-notification'] = {};

      expect(validator(config)).to.equal('[\'header:user-notification\']: should be boolean');
    });

    it('should return error message when header:fullscreen property is not boolean', () => {
      config['header:fullscreen'] = {};

      expect(validator(config)).to.equal('[\'header:fullscreen\']: should be boolean');
    });
  });
});
