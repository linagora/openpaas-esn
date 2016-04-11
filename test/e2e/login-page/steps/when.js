'use strict';

var LoginPage = require('../pages/login');
var loginPage = new LoginPage();

module.exports = function() {

  this.When('I log in with "$email" and "$secret"', function(email, secret) {
    return loginPage.login(email, secret);
  });

};
