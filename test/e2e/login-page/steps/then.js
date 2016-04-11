'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;

chai.use(chaiAsPromised);

var LoginPage = require('../pages/login');
var loginPage = new LoginPage();

module.exports = function() {

  this.Then('the error notification should be present', function(callback) {
    expect(loginPage.errorNotification.isPresent()).to.eventually.be.true.and.notify(callback);
  });

};
