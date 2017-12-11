'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/login module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/login');
  });

  describe('The validator fn', () => {
    let validator;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not an object', () => {
      expect(validator([])).to.equal('should be object');
    });

    it('should return error message when there is no failure property', () => {
      expect(validator({})).to.equal('should have required property \'failure\'');
    });

    it('should return error message when failure size is not defined', () => {
      const config = {
        failure: {}
      };

      expect(validator(config)).to.equal('.failure: should have required property \'size\'');
    });

    it('should return error message when failure size is an integer', () => {
      const config = {
        failure: {
          size: '12'
        }
      };

      expect(validator(config)).to.equal('.failure.size: should be integer');
    });

    it('should return error message when failure size is smaller than 1', () => {
      const config = {
        failure: {
          size: 0
        }
      };

      expect(validator(config)).to.equal('.failure.size: should be >= 1');
    });
  });
});
