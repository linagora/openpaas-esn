'use strict';

var LoginPage = require('../../login-page/pages/login');
var loginPage = new LoginPage();

module.exports = function() {

  this.Given('I am not logged in to OpenPaas', function() {
    return this.logoutAndGoToLoginPage();
  });

  this.Given('I logged in to OpenPaas', function() {
    var self = this;

    return self.logoutAndGoToLoginPage()
      .then(function() {
        return loginPage.login('admin@open-paas.org', 'secret');
      })
      .then(function() {
        return self.waitForUrlToChangeTo(/unifiedinbox\/inbox$/);
      });
  });

  this.Given('I use a mobile screen', function() {
    //https://github.com/linagora/openpaas-esn/wiki/MVP-environment
    return browser.manage().window().setSize(640, 1136);
  });

  this.Given('I use a desktop screen', function() {
    return browser.manage().window().setSize(1366, 768);
  });

};
