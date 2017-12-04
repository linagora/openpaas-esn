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

    it('should return error message when config has additional attributes', function() {
      const config = {
        use24hourFormat: false,
        other: 'value'
      };

      expect(validator(config)).to.equal('should NOT have additional properties');
    });

    it('should return error message when use24hourFormat is not boolean value', function() {
      const config = {
        use24hourFormat: 'false'
      };

      expect(validator(config)).to.equal('.use24hourFormat: should be boolean');
    });

    it('should return nothing when everything is alright', function() {
      const config = {
        use24hourFormat: false
      };

      expect(validator(config)).to.not.exist;
    });
  });
});
