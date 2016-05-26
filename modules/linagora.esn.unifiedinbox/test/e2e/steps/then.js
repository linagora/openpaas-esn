'use strict';

var messagePage = new (require('../pages/message'))();

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

};
