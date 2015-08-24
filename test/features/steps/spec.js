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

  this.Then(/^the title should equal "([^"]*)"$/, function(arg1, callback) {
    expect(browser.getTitle()).to.eventually.equal(arg1).and.notify(callback);
  });
}
