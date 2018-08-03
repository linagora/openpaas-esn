'use strict';

const expect = require('chai').expect;

describe('The user states module', function() {

  describe('The isEnabled function', function() {
    it('should return false only if the specified action is disabled', function() {
      const user = {
        _id: 1,
        states: [{ name: 'login', value: 'disabled'}]
      };
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.isEnabled(user, 'login')).to.be.false;
      expect(module.isEnabled(user, 'search')).to.be.true;
    });

    it('should return true if the user states does not exist', function() {
      const user = { _id: 2 };
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.isEnabled(user, 'login')).to.be.true;
    });
  });

  describe('The validateActionState function', function() {
    it('should return true only if the input is one of defined states', function() {
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.validateActionState('abc')).to.be.false;
      expect(module.validateActionState('disabled')).to.be.true;
    });
  });

  describe('The validateUserAction function', function() {
    it('should return true only if the input is one of defined action', function() {
      const module = this.helpers.requireBackend('core/user/states');

      expect(module.validateUserAction('abc')).to.be.false;
      expect(module.validateUserAction('login')).to.be.true;
    });
  });
});
