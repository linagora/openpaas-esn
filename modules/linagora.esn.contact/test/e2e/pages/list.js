'use strict';

module.exports = function() {
  this.contactsList = element(by.css('.contacts-list'));
  this.createContactFab = this.contactsList.element(by.css('.contact-fab'));
};
