'use strict';

var messagePage = new (require('../pages/message'))();
var inboxAside = new (require('../pages/inbox-aside'))();

module.exports = function() {

  this.Then('I have at least $count message', function(count) {
    return this.expect(messagePage.allMessages.count()).to.eventually.be.at.least(parseInt(count, 10));
  });

  this.Then('My first message is from "$from" with subject "$subject" and preview contains "$preview"', function(from, subject, preview) {
    return protractor.promise.all([
      this.expect(messagePage.firstMessageFrom.getText()).to.eventually.contain(this.USERS[from].email),
      this.expect(messagePage.firstMessageSubject.getText()).to.eventually.equal(subject),
      this.expect(messagePage.firstMessagePreview.getText()).to.eventually.contain(preview)
    ]);
  });

  this.Then(/^I have two notifications "([^"]*)", then "([^"]*)"$/, function(notification_1, notification_2, next) {
    var FOLDER_CREATION_IN_PROGRESS = notification_1;
    var FOLDER_CREATION_SUCCEEDED = notification_2;
    var self = this;

    this.notifications.messages.each(function(message, index) {
      message.getText().then(function(notificationMessage) {
        if (notificationMessage !== FOLDER_CREATION_IN_PROGRESS && notificationMessage !== FOLDER_CREATION_SUCCEEDED) {
          next(new Error('Unexpected notification message: ' + notificationMessage));
        }

        (index === 0) && self.expect(notificationMessage).to.equal(FOLDER_CREATION_IN_PROGRESS);
        (index === 1) && self.expect(notificationMessage).to.equal(FOLDER_CREATION_SUCCEEDED);

        if (notificationMessage === FOLDER_CREATION_SUCCEEDED) {
          next();
        }
      });
    });
  });

  this.Then('I have "$folder" in the sidebar at the root level', function(folder) {
    var self = this;

    return browser.refresh().then(function() {
      return self.expect(inboxAside.aside.element(by.css('[title="' + folder + '"]')).isPresent()).to.eventually.equal(true);
    });
  });
};
