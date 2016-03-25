'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var LoginPageObject = require('./pageObjects/login-pageObject');

chai.use(chaiAsPromised);
var expect = chai.expect;
var ADMIN_OBJECT = require('../../../fixtures/populate/data/populate-objects').ADMIN;
var username = ADMIN_OBJECT.accounts[0].emails[0];
var password = ADMIN_OBJECT.password;

var waitUrlToBeRedirected = function() {
  var oldUrl;

  browser.getCurrentUrl()
    .then(function(url) {
      oldUrl = url;
    })
    .then(function() {
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(newUrl) {
          return newUrl !== oldUrl;
        });
      });
    });
};

describe('OpenPaaS login page', function() {
  var loginPage;

  beforeEach(function() {
    browser.ignoreSynchronization = true;
    browser.get('/');
    browser.waitForAngular();
    loginPage = new LoginPageObject();
  });

  afterEach(function() {
    browser.get('/logout');
  });

  it('should not change url when login fails', function() {
    loginPage.login(username, 'not' + password);

    expect(browser.getLocationAbsUrl()).to.eventually.equal('/');
    expect(loginPage.errorNotification.isPresent()).to.eventually.be.true;
  });

  it('should change url when login success', function() {
    loginPage.login(username, password);
    waitUrlToBeRedirected();

    expect(browser.getLocationAbsUrl()).to.eventually.not.equal('/');
  });

  it('should continue to the asked page', function() {
    browser.get('/#/?continue=%2Faccounts');
    loginPage.login(username, password);
    waitUrlToBeRedirected();

    expect(browser.getLocationAbsUrl()).to.eventually.equal('/accounts');
  });
});
