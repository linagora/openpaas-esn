'use strict';

var q = require('q');

var messagePage = new (require('../pages/message'))();
var inboxAside = new (require('../pages/inbox-aside'))();
var indicatorPage = require('../pages/indicator')();

module.exports = function() {

  this.Then('I have at least $count message', { timeout: 60 * 1000 }, function(messageCount) {
    var self = this,
        expectedMessageCount = parseInt(messageCount, 10),
        maxTryCount = 10;

    function _try(tryCount) {
      return browser.refresh()
        .then(messagePage.clickOnModuleInMenu.bind(messagePage))
        .then(function() { return messagePage.allMessages.count(); })
        .then(function(messageCount) {
          if (messageCount < expectedMessageCount && tryCount <= maxTryCount) {
            return _try(tryCount + 1);
          }

          return self.expect(messageCount).to.be.at.least(expectedMessageCount);
        });
    }

    return _try(1);
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

  this.Then('I see the vacation indicator', function() {
    return this.expect(indicatorPage.isPresent()).to.eventually.equal(true);
  });

  this.Then('I see a message from "$from" with subject "$subject" and preview contains "$preview"', { timeout: 60 * 1000 }, function(from, subject, preview, done) {

    var maxTryCount = 10;
    var self = this;

    _try(1);

    function _try(tryCount) {
      return _check().then(done.bind(null, null), function() {
        if (tryCount < maxTryCount) {
          return browser.refresh().then(_try.bind(null, tryCount + 1));
        } else {
          done(new Error('Cannot find the message'));
        }
      });
    }

    function _check() {
      return messagePage.allMessages.then(function(messages) {
        return q.all(messages.map(_checkMessage))
          .then(q.reject, q.when);
      });
    }

    function _checkMessage(message) {
      var messageSubject = message.element(by.css('.inbox-subject'));
      var messageFrom = message.element(by.css('.emailer'));
      var messagePreview = message.element(by.css('.preview'));

      return q.all([
        self.expect(messageFrom.getText()).to.eventually.contain(self.USERS[from].email),
        self.expect(messageSubject.getText()).to.eventually.equal(subject),
        self.expect(messagePreview.getText()).to.eventually.contain(preview)
      ]).then(q.reject, q.when);
    }
  });
};
