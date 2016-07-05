'use strict';

var q = require('q');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

var loginPage = new (require('../login-page/pages/login'))();
var notifications = new (require('./pages/notifications'))();

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

function tryUntilSuccess(task, options) {
  var maxTryCount = options.maxTryCount || 10;
  var waitBeforeRetry = options.waitBeforeRetry;
  var refreshBrowser = options.refreshBeforeRetry ? browser.refresh.bind(browser) : q.when;
  var deferred = q.defer();

  _try(1);

  function _try(tryCount) {
    return task().then(function() {
      deferred.resolve();
    }, function() {
      if (tryCount < maxTryCount) {
        _wait(waitBeforeRetry)
          .then(refreshBrowser)
          .then(_try.bind(null, tryCount + 1));
      } else {
        deferred.reject();
      }
    });
  }

  function _wait(timeout) {
    if (!timeout) { return q.when(); }

    var deferred = q.defer();

    setTimeout(function() {
      deferred.resolve();
    }, timeout);

    return deferred.promise;
  }

  return deferred.promise;
}

function World() {
  this.expect = chai.expect;

  this.notifications = notifications;
  this.waitUrlToBeRedirected = waitUrlToBeRedirected;
  this.logoutAndGoToLoginPage = logoutAndGoToLoginPage;
  this.logIn = logIn;
  this.tryUntilSuccess = tryUntilSuccess;
}

World.prototype.USERS = {
  admin: {
    displayName: 'admin admin',
    email: 'admin@open-paas.org'
  },
  user1: {
    displayName: 'John1 Doe1',
    email: 'user1@open-paas.org'
  },
  user2: {
    displayName: 'John2 Doe2',
    email: 'user2@open-paas.org'
  }
};

module.exports = function() {
  this.World = World;
};
