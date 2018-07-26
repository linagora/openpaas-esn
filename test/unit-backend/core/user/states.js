'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The user states module', function() {

  describe('The isEnabled function', function() {
    it('should return false only if the specified action is disabled', function() {
      const user = {
        _id: 1,
        states: [{ name: 'login', value: 'disabled'}]
      };
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.isEnabled(user, 'login')).to.equal(false);
      expect(module.isEnabled(user, 'search')).to.equal(true);
    });

    it('should return true if the user states does not exist', function() {
      const user = { _id: 2 };
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.isEnabled(user, 'login')).to.equal(true);
    });
  });

  describe('The validateActionState function', function() {
    it('should return true only if the input is one of defined states', function() {
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.validateActionState('abc')).to.be.false;
      expect(module.validateActionState('disabled')).to.be.true;
    });
  });
});
