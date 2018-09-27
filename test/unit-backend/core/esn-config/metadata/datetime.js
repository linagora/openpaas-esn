'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/datetime module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/datetime');
  });

  describe('The validator function', () => {
    let validator;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not an object', () => {
      const config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when use24hourFormat is not boolean value', () => {
      const config = {
        use24hourFormat: 'false'
      };

      expect(validator(config)).to.equal('.use24hourFormat: should be boolean');
    });

    it('should return error message when timeZone is not a string', () => {
      const config = {
        timeZone: 88,
        use24hourFormat: false
      };

      expect(validator(config)).to.equal('.timeZone: should be string');
    });

    it('should not validate timeZone if it is not given', () => {
      const config = {
        use24hourFormat: false
      };

      expect(validator(config)).to.not.exist;
    });

    it('should return error message when timeZone is not supported', () => {
      const config = {
        timeZone: 'foobar',
        use24hourFormat: false
      };

      expect(validator(config)).to.equal('time zone "foobar" is not supported');
    });

    it('should return nothing when everything is alright', () => {
      const config = {
        use24hourFormat: false,
        timeZone: 'Asia/Saigon'
      };

      expect(validator(config)).to.not.exist;
    });

    it('should remove additional attributes and return nothing when everything is alright', () => {
      const config = {
        use24hourFormat: false,
        timeZone: 'Asia/Saigon',
        other: 'value'
      };

      expect(validator(config)).to.not.exist;
      expect(config.other).to.not.exist;
    });
  });
});
