'use strict';

var q = require('q');

var messagePage = new (require('../pages/message'))();
var inboxAside = new (require('../pages/inbox-aside'))();
var inboxAddFolder = new (require('../pages/inbox-add-folder'))();
var configurationPage = require('../pages/configuration')();
var subheaderPage = require('../pages/subheader')();

module.exports = function() {

  this.When('I press "Send" button and wait for the message to be sent', function(next) {
    var self = this;
    var succeededMessage = 'Sending of your message succeeded';

    return messagePage.composerSendButton.click()
      .then(check)
      .then(next);

    function check() {
      return q.all(self.notifications.messages.map(function(message) {
        return message.getText().then(function(notificationMessage) {
          if (notificationMessage === succeededMessage) {
            return q.reject();
          }
        });
      })).then(q.reject, q.when);
    }
  });

  this.When('I write "$value" in the Name field', function(value) {
    inboxAddFolder.addFolderName.click();
    inboxAddFolder.addFolderName.sendKeys(value);

    return this.expect(inboxAddFolder.addFolderName.getAttribute('value')).to.eventually.contain(value);
  });

  this.When('I set "$value" in the "Is located under" field', function(value) {
    inboxAddFolder.addFolderParentName.element(by.cssContainingText('option', value)).click();

    return this.expect(inboxAddFolder.addFolderParentName.getText()).to.eventually.contain(value);
  });

  this.When('I click on the "$label" item on Inbox sidebar', function(label) {
    var cssAttribute;

    if (label === 'Configuration') {
      cssAttribute = '[ui-sref="unifiedinbox.configuration"]';
    } else if (label === 'New folder') {
      cssAttribute = '[ui-sref="unifiedinbox.configuration.folders.add"]';
    } else {
      throw new Error('No such item on Inbox sidebar: ' + label);
    }

    return inboxAside.aside.element(by.css(cssAttribute)).click();
  });

  this.When('I go to "$label" configuration tab', function(label) {
    return configurationPage.goToTab(label);
  });

  this.When('I fill start date with "$startDate" and message body with "$body"', function(startDate, body) {
    return configurationPage.vacationTab.toggleEnable(true)
      .then(function() {
        return q.all([
          configurationPage.vacationTab.fillStartDate(startDate),
          configurationPage.vacationTab.fillBody(body)
        ]);
      });
  });

  this.When('I press "$label" button on Inbox subheader', function(label) {
    return subheaderPage.clickButton(label);
  });

  this.When('I go to "$folder" folder', function(folder) {
    return inboxAside.aside.element(by.css('div[title="' + folder + '"]')).click();
  });
};
