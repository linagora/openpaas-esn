'use strict';

module.exports = function() {
  this.contactCreateForm = element(by.css('contact-edition-form'));
  this.contactCreateHeader = element(by.css('.contact-header'));
  this.firstname = this.contactCreateForm.element(by.model('contact.firstName'));
  this.lastname = this.contactCreateForm.element(by.model('contact.lastName'));
  this.createButton = this.contactCreateHeader.element(by.css('[ng-click="accept()"]'));
};
