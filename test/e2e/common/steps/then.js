'use strict';

module.exports = function() {

  this.Then('the location url should equal "$url"', function(url, callback) {
    this.expect(browser.getLocationAbsUrl()).to.eventually.equal(url).and.notify(callback);
  });

  this.Then('the location url should not equal "$url"', function(url, callback) {
    this.expect(browser.getLocationAbsUrl()).to.not.eventually.equal(url).and.notify(callback);
  });

};
