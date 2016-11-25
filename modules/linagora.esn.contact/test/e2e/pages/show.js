'use strict';

module.exports = function() {
  this.contactDisplay = element(by.css('contact-display'));
  this.contactDisplayName = this.contactDisplay.element(by.binding('contact.displayName'));
};
