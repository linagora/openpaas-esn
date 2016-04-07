'use strict';

module.exports = function() {

  this.When('I go on "$url"', function(url) {
    return browser.get(url);
  });

  this.When('I wait for the url redirection', function(callback) {
    this.waitUrlToBeRedirected().thenFinally(callback);
  });

};
