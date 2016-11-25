'use strict';

var LoginPage = require('../pages/login');
var loginPage = new LoginPage();

module.exports = function() {

  this.Then('the error notification should be present', function() {
    return this.expect(loginPage.errorNotification.isPresent()).to.eventually.be.true;
  });

};
