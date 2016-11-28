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

  this.Then('I see a notification with message "$message"', function(message) {
    return this.notifications.hasText(message);
  });

  this.Then('I have "$folder" in the sidebar at the root level', function(folder) {
    return this.expect(inboxAside.aside.element(by.css('[title="' + folder + '"]')).isPresent()).to.eventually.equal(true);
  });

  this.Then('I see the vacation indicator', function() {
    return this.expect(indicatorPage.isPresent()).to.eventually.equal(true);
  });

  this.Then('I see a message from "$from" with subject "$subject" and preview contains "$preview"', function(from, subject, preview) {

    const self = this;
    const EC = protractor.ExpectedConditions;

    function messageHasExpectedFields(message) {
      return EC.and(
        EC.textToBePresentInElement(messagePage.subjectElementOf(message), subject),
        EC.textToBePresentInElement(messagePage.fromElementOf(message), self.USERS[from].displayName),
        EC.textToBePresentInElement(messagePage.previewElementOf(message), preview)
      )();
    }

    function check() {
      return messagePage.allMessages
        .filter(messageHasExpectedFields)
        .count()
        .then(count => {
          if (count > 0) {
            return protractor.promise.fulfilled(true);
          }

          return inboxAside.allMail.click().then(() => protractor.promise.fulfilled(false));
        });
    }

    return browser.wait(check, 10000, 'The expected email can\'t be found');
  });
};
