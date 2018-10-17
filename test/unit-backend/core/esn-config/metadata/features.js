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
        'application-menu:invitation': false,
        'application-menu:appstore': false,
        'control-center:invitation': false,
        'application-menu:members': false,
        'header:user-notification': false,
        'header:fullscreen': false,
        'control-center:password': false,
        'application-menu:jobqueue': false,
        'control-center:appstore': true
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when application-menu:invitation property is not boolean', () => {
      config['application-menu:invitation'] = {};

      expect(validator(config)).to.equal('[\'application-menu:invitation\']: should be boolean');
    });

    it('should return error message when application-menu:appstore property is not boolean', () => {
      config['application-menu:appstore'] = {};

      expect(validator(config)).to.equal('[\'application-menu:appstore\']: should be boolean');
    });

    it('should return error message when application-menu:jobqueue property is not boolean', () => {
      config['application-menu:jobqueue'] = {};

      expect(validator(config)).to.equal('[\'application-menu:jobqueue\']: should be boolean');
    });

    it('should return error message when control-center:password property is not boolean', () => {
      config['control-center:password'] = {};

      expect(validator(config)).to.equal('[\'control-center:password\']: should be boolean');
    });

    it('should return error message when application-menu:members property is not boolean', () => {
      config['application-menu:members'] = {};

      expect(validator(config)).to.equal('[\'application-menu:members\']: should be boolean');
    });

    it('should return error message when application-menu:invitation property is not boolean', () => {
      config['application-menu:invitation'] = {};

      expect(validator(config)).to.equal('[\'application-menu:invitation\']: should be boolean');
    });

    it('should return error message when control-center:invitation property is not boolean', () => {
      config['control-center:invitation'] = {};

      expect(validator(config)).to.equal('[\'control-center:invitation\']: should be boolean');
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
