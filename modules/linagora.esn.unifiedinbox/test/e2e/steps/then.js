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

  this.Then('I see a notification with message "$message"', { timeout: 60 * 1000 }, function(message, done) {

    var self = this;

    self.tryUntilSuccess(check, {
        waitBeforeRetry: 2000,
        maxTryCount: 5
      })
      .then(done.bind(null, null))
      .catch(function() {
        done(new Error('The wanted notification is not present'));
      });

    function check() {
      return q.all(self.notifications.messages.map(checkNotification)).then(q.reject, q.when);
    }

    function checkNotification(notification) {
      return notification.getText().then(function(text) {
        if (text === message) {
          return $q.reject();
        }
      });
    }
  });

  this.Then('I have "$folder" in the sidebar at the root level', function(folder) {
    return this.expect(inboxAside.aside.element(by.css('[title="' + folder + '"]')).isPresent()).to.eventually.equal(true);
  });

  this.Then('I see the vacation indicator', function() {
    return this.expect(indicatorPage.isPresent()).to.eventually.equal(true);
  });

  this.Then('I see a message from "$from" with subject "$subject" and preview contains "$preview"', { timeout: 60 * 1000 }, function(from, subject, preview, done) {

    var self = this;

    this.tryUntilSuccess(_check, {
      waitBeforeRetry: 2000,
      runBeforeRetry: function() {
        return inboxAside.aside.element(by.css('div[title="All Mail"]')).click();
      }
    }).then(done.bind(null, null), done.bind(null, new Error('Cannot find the message')));

    function _check() {
      return messagePage.allMessages.then(function(messages) {
        return q.all(messages.map(_checkMessage)).then(q.reject, q.when);
      });
    }

    function _checkMessage(message) {
      var messageSubject = message.element(by.css('.inbox-subject'));
      var messageFrom = message.element(by.css('.emailer'));
      var messagePreview = message.element(by.css('.preview'));

      return q.all([
        _checkTextContain(messageFrom, self.USERS[from].email),
        _checkTextEqual(messageSubject, subject),
        _checkTextContain(messagePreview, preview)
      ]).then(q.reject, q.when);
    }

    function _checkTextContain(element, str) {
      return element.getText().then(function(text) {
        if (text.indexOf(str) > -1) {
          return q.when();
        }

        return q.reject();
      });
    }

    function _checkTextEqual(element, str) {
      return element.getText().then(function(text) {
        if (str === text) {
          return q.when();
        }

        return q.reject();
      });
    }
  });
};
