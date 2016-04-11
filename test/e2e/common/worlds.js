'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

var CHANGE_URL_WAIT_MS = 10000;

function waitUrlToBeRedirected() {
  return browser.driver.getCurrentUrl().then(function(url) {
    return browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function(newUrl) {
        return newUrl !== url;
      });
    }, CHANGE_URL_WAIT_MS);
  });
}

function waitForUrlToChangeTo(urlRegex, timeout) {
  return browser.driver.wait(function() {
    return browser.driver.getCurrentUrl().then(function(currentUrl) {
      return urlRegex.test(currentUrl);
    });
  }, timeout || CHANGE_URL_WAIT_MS);
}

function logoutAndGoToLoginPage() {
  browser.get('/logout');

  return waitForUrlToChangeTo(/\/#\/$/, 5000);
}

function World() {
  this.expect = chai.expect;

  this.waitUrlToBeRedirected = waitUrlToBeRedirected;
  this.waitForUrlToChangeTo = waitForUrlToChangeTo;
  this.logoutAndGoToLoginPage = logoutAndGoToLoginPage;
}

module.exports = function() {
  this.World = World;
};
