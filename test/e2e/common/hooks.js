'use strict';

module.exports = function() {

  this.After(function() {
    return this.logoutAndGoToLoginPage();
  });

};
