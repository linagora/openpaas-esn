'use strict';

var messagePage = new (require('../pages/message'))();
var inboxAside = new (require('../pages/inbox-aside'))();
var inboxAddFolder = new (require('../pages/inbox-add-folder'))();

var SENDING_MESSAGE = 'Sending of your message in progress...',
    SUCCEED_MESSAGE = 'Sending of your message succeeded';

module.exports = function() {

  this.When('I press "Send" button and wait for the message to be sent', function(next) {
    messagePage.composerSendButton.click();

    this.notifications.messages.each(function(message) {
      message.getText().then(function(notificationMessage) {
        if (notificationMessage !== SENDING_MESSAGE && notificationMessage !== SUCCEED_MESSAGE) {
          next(new Error('Unexpected notification message: ' + notificationMessage));
        }
        if (notificationMessage === SUCCEED_MESSAGE) {
          next();
        }
      });
    });
  });

  this.When('I click on the "$page" label', function(page) {
    var cssAttribute;

    if (page === 'New folder') {
      cssAttribute = '[ui-sref="unifiedinbox.configuration.folders.add"]';
    }

    inboxAside.aside.element(by.css(cssAttribute)).click();

    return this.expect(inboxAddFolder.addFolderConfiguration.isPresent()).to.eventually.equal(true);
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

  this.When('I press "Create" button', function() {
    return inboxAddFolder.createButton.click();
  });
};
