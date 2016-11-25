'use strict';

const listPage = new (require('../pages/list'))();
const showPage = new (require('../pages/show'))();
const EC = protractor.ExpectedConditions;

module.exports = function() {

  this.Then('I can see the contact list', function() {
    return this.expect(listPage.contactsList.isDisplayed()).to.eventually.equal(true);
  });

  this.Then('I am redirected to contact show page', function() {
    return browser.waitForAngular().then(() =>
      this.expect(EC.urlContains('/#/contact/show/')()).to.eventually.equal(true)
    );
  });

  this.Then('I see contact "$displayName" in the contact show page', function(displayName) {
    return this.expect(showPage.contactDisplayName.getText()).to.eventually.equal(displayName);
  });
};
