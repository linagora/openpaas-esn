'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

module.exports = function() {
  this.Given(/^I enter my credentials$/, function(callback) {
    element(by.model('credentials.username')).sendKeys('admin@open-paas.org');
    element(by.model('credentials.password')).sendKeys('secret');
    callback();
  });
}
