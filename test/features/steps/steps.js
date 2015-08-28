'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

module.exports = function() {
  this.Given(/^I go on "([^"]*)"$/, function(arg1, callback) {
    browser.get('http://localhost:8080');
    callback();
  });

  this.When(/^I submit the form$/, function(callback) {
    element(by.css('.btn-login')).click();
    setTimeout(callback, 5000);
  });

  this.Then(/^The title should equal "([^"]*)"$/, function(arg1, callback) {
    expect(browser.getTitle()).to.eventually.equal(arg1).and.notify(callback);
  });

  this.Then(/^I should be redirected to "([^"]*)"$/, function(arg1, callback) {
    expect(browser.getLocationAbsUrl()).to.eventually.contain(arg1).and.notify(callback);
  });
}
