'use strict';

module.exports = function() {

  this.When('I log in to OpenPaaS with "$account" account', function(account) {
    return this.logIn(this.USERS[account].email);
  });

  this.When('I log out from OpenPaaS', function() {
    return this.logoutAndGoToLoginPage();
  });

  this.When('I go on "$url"', function(url) {
    return browser.get(url);
  });

  this.When('I wait for the url redirection', function() {
    return this.waitUrlToBeRedirected();
  });

};
