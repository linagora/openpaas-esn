'use strict';

/* global by: false */

module.exports = function() {
  this.Given(/^I enter my credentials$/, function(callback) {
    element(by.model('credentials.username')).sendKeys('admin@open-paas.org');
    element(by.model('credentials.password')).sendKeys('secret');
    callback();
  });
};
