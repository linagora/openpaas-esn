const expect = require('chai').expect;

describe('The core/esn-config/metadata/language module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/language');
  });

  describe('The validator fn', () => {
    let validator;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not a string', () => {
      expect(validator({})).to.equal('should be string');
    });

    it('should return error message when config is not a supported language', () => {
      expect(validator('invalid')).to.equal('\'invalid\' is not a supported language');
    });
  });
});
