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
        'control-center:invitation': false,
        'application-menu:members': false,
        'control-center:members': false,
        'application-menu:communities': false,
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

    it('should return error message when application-menu:jobqueue property is not boolean', () => {
      config['application-menu:jobqueue'] = {};

      expect(validator(config)).to.equal('[\'application-menu:jobqueue\']: should be boolean');
    });

    it('should return error message when control-center:password property is not boolean', () => {
      config['control-center:password'] = {};

      expect(validator(config)).to.equal('[\'control-center:password\']: should be boolean');
    });

    it('should return error message when application-menu:communities property is not boolean', () => {
      config['application-menu:communities'] = {};

      expect(validator(config)).to.equal('[\'application-menu:communities\']: should be boolean');
    });

    it('should return error message when control-center:members property is not boolean', () => {
      config['control-center:members'] = {};

      expect(validator(config)).to.equal('[\'control-center:members\']: should be boolean');
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
  });
});
