'use strict';

var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    LoginPageObject = require('./pageObjects/login-pageObject'),
    loginPage = new LoginPageObject(),
    CHANGE_URL_WAIT_MS = 10000;

chai.use(chaiAsPromised);
var expect = chai.expect;

var waitUrlToBeRedirected = function() {
  return browser.getCurrentUrl().then(function(url) {
    return browser.wait(function() {
      return browser.getCurrentUrl().then(function(newUrl) {
        return newUrl !== url;
      });
    }, CHANGE_URL_WAIT_MS);
  });
};

module.exports = function() {

  this.After(function() {
    browser.get('/logout');
    browser.waitForAngular();
  });

  this.Given('I go on "$url"', function(url) {
    // https://gist.github.com/tfnico/8471223
    browser.ignoreSynchronization = true;
    browser.get(url);
    browser.waitForAngular();
  });

  this.When('I log in with "$email" and "$secret"', function(email, secret) {
    return loginPage.login(email, secret);
  });

  this.When('I wait for the url redirection', function(callback) {
    waitUrlToBeRedirected().thenFinally(callback);
  });

  this.Then('the error notification should be present', function(callback) {
    expect(loginPage.errorNotification.isPresent()).to.eventually.be.true.and.notify(callback);
  });

  this.Then('the location url should equal "$url"', function(url, callback) {
    expect(browser.getLocationAbsUrl()).to.eventually.equal(url).and.notify(callback);
  });

  this.Then('the location url should not equal "$url"', function(url, callback) {
    expect(browser.getLocationAbsUrl()).to.not.eventually.equal(url).and.notify(callback);
  });

};
