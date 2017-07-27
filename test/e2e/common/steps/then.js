'use strict';

module.exports = function() {

  this.Then('the location url should equal "$url"', function(url) {
    return this.expect(browser.getLocationAbsUrl()).to.eventually.equal(url);
  });

  this.Then('the location url should not equal "$url"', function(url) {
    return this.expect(browser.getLocationAbsUrl()).to.not.eventually.equal(url);
  });

  this.Then('I see a notification with message "$message"', function(message) {
    return this.notifications.hasText(message);
  });

};
