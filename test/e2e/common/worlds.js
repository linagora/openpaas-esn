'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var loginPage = new (require('../login-page/pages/login'))();

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

function logIn(account) {
  return logoutAndGoToLoginPage()
    .then(function() {
      return loginPage.login(account, 'secret');
    })
    .then(function() {
      return waitForUrlToChangeTo(/unifiedinbox\/inbox$/);
    });
}

function World() {
  this.expect = chai.expect;

  this.waitUrlToBeRedirected = waitUrlToBeRedirected;
  this.logoutAndGoToLoginPage = logoutAndGoToLoginPage;
  this.logIn = logIn;
}

World.prototype.USERS = {
  admin: 'admin@open-paas.org',
  user1: 'user1@open-paas.org',
  user2: 'user2@open-paas.org'
};

module.exports = function() {
  this.World = World;
};
