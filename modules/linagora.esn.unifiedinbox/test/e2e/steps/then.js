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
    return q.all([
      this.expect(messagePage.firstMessageFrom.getText()).to.eventually.contain(this.USERS[from].email),
      this.expect(messagePage.firstMessageSubject.getText()).to.eventually.equal(subject),
      this.expect(messagePage.firstMessagePreview.getText()).to.eventually.contain(preview)
    ]);
  });

  this.Then('I see a notification with message "$message"', function(message) {
    return this.notifications.hasText(message);
  });

  this.Then('I have "$folder" in the sidebar at the root level', function(folder) {
    return this.expect(inboxAside.aside.element(by.css('[title="' + folder + '"]')).isPresent()).to.eventually.equal(true);
  });

  this.Then('I see the vacation indicator', function() {
    return this.expect(indicatorPage.isPresent()).to.eventually.equal(true);
  });

  this.Then('I see a message from "$from" with subject "$subject" and preview contains "$preview"', { timeout: 60 * 1000 }, function(from, subject, preview) {

    const self = this;
    const EC = protractor.ExpectedConditions;

    const messagesWithExpectedValues = messagePage.allMessages.filter((elem, index) => {
      var messageSubject = elem.element(by.css('.inbox-subject-inline'));
      var messageFrom = elem.element(by.css('.emailer'));
      var messagePreview = elem.element(by.css('.inbox-preview-inline.preview'));

      return EC.and(
        EC.textToBePresentInElement(messageSubject, subject),
        EC.textToBePresentInElement(messageFrom, self.USERS[from].displayName),
        EC.textToBePresentInElement(messagePreview, preview)
      )();
    });

    return browser.wait(messagesWithExpectedValues.count().then(count => {
      if (count === 0) {
        return inboxAside.aside.element(by.css('div[title="All Mail"]')).click()
          .then(() => {
            var deferred = protractor.promise.defer();
            deferred.reject(new Error('No such mail'));
            return deferred.promise;
          });
      }
    }), 10000);
  });
};
