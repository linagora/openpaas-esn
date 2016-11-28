'use strict';

var messagePage = new (require('../pages/message'))();
var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {

  this.Given('"$account" is an existing james user', function(account) {
    this.logIn(this.USERS[account].email);
    browser.waitForAngular(); // james user creation is done with an angular $http request

    return this.logoutAndGoToLoginPage();
  });

  this.Given('Display Unified Inbox', function() {
    messagePage.clickOnModuleInMenu();

    return this.expect(mainPanel.isDisplayed()).to.eventually.equal(true);
  });

  this.Given('Unified Inbox composer opened', function() {
    messagePage.openComposerFab.click();

    return this.expect(messagePage.composer.isDisplayed()).to.eventually.equal(true);
  });

  this.Given('"$field" recipient list contains "$user" email', function(field, user) {
    messagePage['composer' + field].click();
    messagePage['composer' + field].sendKeys(this.USERS[user].email);

    return messagePage['composer' + field].sendKeys(protractor.Key.ENTER);
  });

  this.Given('Subject is "$fieldValue"', function(value) {
    messagePage.composerSubject.click();
    messagePage.composerSubject.sendKeys(value);

    return this.expect(messagePage.composerSubject.getAttribute('value')).to.eventually.contain(value);
  });

  this.Given('Body is "$fieldValue"', function(value) {
    messagePage.composerBody.click();
    messagePage.composerBody.clear();
    messagePage.composerBody.sendKeys(value);

    return this.expect(messagePage.composerBody.getText()).to.eventually.not.be.empty;
  });

};
