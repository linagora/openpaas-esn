'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/datetime module', function() {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/datetime');

  });

  describe('The validator fn', function() {
    let validator;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not an object', function() {
      const config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when config does not contains dateFormat', function() {
      const config = {};

      expect(validator(config)).to.equal('should have required property \'dateFormat\'');
    });

    it('should return error message when config has additional attributes', function() {
      const config = {
        dateFormat: 'date format',
        timeFormat: 'time format',
        use24hourFormat: false,
        other: 'value'
      };

      expect(validator(config)).to.equal('should NOT have additional properties');
    });

    it('should return error message when use24hourFormat is not boolean value', function() {
      const config = {
        dateFormat: 'date format',
        timeFormat: 'time format',
        use24hourFormat: 'false'
      };

      expect(validator(config)).to.equal('.use24hourFormat: should be boolean');
    });

    it('should return error message when dateFormat is longer than 255 characters', function() {
      let longerThan255String = '123457890';

      do {
        longerThan255String += longerThan255String;
      } while (longerThan255String.length <= 255);

      const config = {
        dateFormat: longerThan255String,
        timeFormat: 'time format',
        use24hourFormat: false
      };

      expect(validator(config)).to.equal('.dateFormat: should NOT be longer than 225 characters');
    });

    it('should return error message when timeFormat is longer than 255 characters', function() {
      let longerThan255String = '123457890';

      do {
        longerThan255String += longerThan255String;
      } while (longerThan255String.length <= 255);

      const config = {
        dateFormat: 'date format',
        timeFormat: longerThan255String,
        use24hourFormat: false
      };

      expect(validator(config)).to.equal('.timeFormat: should NOT be longer than 225 characters');
    });

    it('should return nothing when everything is alright', function() {
      const config = {
        dateFormat: 'date format',
        timeFormat: 'time format',
        use24hourFormat: false
      };

      expect(validator(config)).to.not.exist;
    });
  });
});
