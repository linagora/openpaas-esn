'use strict';

var expect = require('chai').expect;

describe('The array helper', function() {
  describe('The isNullOrEmpty fn', function() {

    it('should return true when null', function() {
      var module = this.helpers.requireBackend('helpers/array');
      expect(module.isNullOrEmpty(null)).to.be.true;
    });

    it('should return true when undefined', function() {
      var module = this.helpers.requireBackend('helpers/array');
      expect(module.isNullOrEmpty()).to.be.true;
    });

    it('should return true when undefined empty', function() {
      var module = this.helpers.requireBackend('helpers/array');
      expect(module.isNullOrEmpty([])).to.be.true;
    });

    it('should return false when array have elements', function() {
      var module = this.helpers.requireBackend('helpers/array');
      expect(module.isNullOrEmpty([1])).to.be.false;
    });
  });
});
