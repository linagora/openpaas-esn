'use strict';

const listPage = new (require('../pages/list'))();
const createPage = new (require('../pages/create'))();

module.exports = function() {

  this.When('I click on the contact FAB button', function() {
    return listPage.createContactFab.click();
  });

  this.When('I fill firstname with "$firstname"', function(firstname) {
    return createPage.firstname.sendKeys(firstname);
  });

  this.When('I fill lastname with "$lastname"', function(lastname) {
    return createPage.lastname.sendKeys(lastname);
  });

  this.When('I click on the create button', function() {
    browser.executeScript('window.scrollTo(0, 0)'); // scroll to top to make button visible

    return createPage.createButton.click();
  });

};
