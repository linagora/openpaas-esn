'use strict';

module.exports = function() {

  this.Given('I am not logged in to OpenPaaS', function() {
    return this.logoutAndGoToLoginPage();
  });

  this.Given('I logged in to OpenPaaS', function() {
    return this.logIn(this.USERS.admin.email);
  });

  this.Given('I logged in to OpenPaaS with "$account" account', function(account) {
    return this.logIn(this.USERS[account].email);
  });

  this.Given('I use a mobile screen', function() {
    //https://github.com/linagora/openpaas-esn/wiki/MVP-environment
    return browser.manage().window().setSize(640, 1136);
  });

  this.Given('I use a desktop screen', function() {
    return browser.manage().window().setSize(1400, 768);
  });

};
