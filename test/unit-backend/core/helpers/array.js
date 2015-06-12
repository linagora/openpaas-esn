'use strict';

var expect = require('chai').expect;

describe('The array helpers module', function() {

  it('should return true if the parameter is undefined', function() {
    var arrayHelpers = this.helpers.requireBackend('helpers/array');
    expect(arrayHelpers.isNullOrEmpty(null)).to.be.true;
  });

  it('should return true if the parameter is an empty object', function() {
    var arrayHelpers = this.helpers.requireBackend('helpers/array');
    expect(arrayHelpers.isNullOrEmpty({})).to.be.true;
  });

  it('should return true if the parameter is an empty array', function() {
    var arrayHelpers = this.helpers.requireBackend('helpers/array');
    expect(arrayHelpers.isNullOrEmpty([])).to.be.true;
  });

  it('should return false if the parameter is an array with one element', function() {
    var arrayHelpers = this.helpers.requireBackend('helpers/array');
    expect(arrayHelpers.isNullOrEmpty(['test'])).to.be.false;
  });

  it('should return true if the parameter is an object with one attribute', function() {
    var arrayHelpers = this.helpers.requireBackend('helpers/array');
    expect(arrayHelpers.isNullOrEmpty({value: 'test'})).to.be.true;
  });
});

