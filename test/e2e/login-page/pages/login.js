'use strict';

module.exports = function() {
  this.username = element(by.model('credentials.username'));
  this.password = element(by.model('credentials.password'));
  this.submit = element(by.css('[type="submit"]'));
  this.errorNotification = element(by.css('[data-notify="container"]'));

  this.login = function(username, password) {
    this.username.sendKeys(username);
    this.password.sendKeys(password);

    return this.submit.click();
  };
};
