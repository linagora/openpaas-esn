'use strict';

const homePage = new (require('../pages/home'))();

module.exports = function() {

  this.Given('I am on the Contact module page', function() {
    homePage.clickOnModuleInMenu();

    return this.expect(browser.getCurrentUrl()).to.eventually.match(/\/#\/contact$/);
  });

};
