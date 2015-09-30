'use strict';

/* global by: false */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var request = require('request');
var url = require('url');

module.exports = function() {
  this.Given(/^I am authenticated$/, function(callback) {
    var options = {
      uri: 'http://localhost:8080/api/login',
      method: 'POST',
      json: {
        username: 'admin@open-paas.org',
        password: 'secret',
        rememberme: false
      }
    };

    request(options, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var authenticationCookie =
          response.headers['set-cookie']
            .pop()
            .split(';')
            .shift()
            .split('=')
            .pop();

        browser.manage().addCookie('connect.sid', authenticationCookie, '/', 'localhost');
        callback();
      }
    });
  });

  this.Given(/^I go on "([^"]*)"$/, function(arg1, callback) {
    browser.get(url.resolve('http://localhost:8080', arg1));
    callback();
  });

  this.When(/^I change the url location to "([^"]*)"$/, function(arg1, callback) {
    browser.get(url.resolve('http://localhost:8080', arg1));
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
};
