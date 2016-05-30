'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {

  // TOP MENU BUTTONS
  this.menuButton = element(by.css('#header .application-menu-toggler'));
  this.unifiedInboxButton = element(by.css('#header .application-menu a[href="/#/unifiedinbox"]'));
  this.clickOnModuleInMenu = function() {
    return this.menuButton.click().then(this.unifiedInboxButton.click);
  }.bind(this);

  // MESSAGE
  this.allMessages = element.all(by.css('.inbox-list-item'));
  this.firstMessage = element.all(by.css('.inbox-list-item')).first();
  this.firstMessageSubject = this.firstMessage.element(by.css('.inbox-subject'));
  this.firstMessageFrom = this.firstMessage.element(by.css('.emailer'));
  this.firstMessagePreview = this.firstMessage.element(by.css('.preview'));

  // COMPOSER RELATED ELEMENTS
  this.openComposerFab = element(by.css('inbox-fab button'));
  this.composer = element(by.css('form.compose'));
  this.composerSubject = this.composer.element(by.css('.compose-subject'));
  this.composerBody = this.composer.element(by.css('email-body-editor div[contenteditable].panel-body'));
  this.composerTo = this.composer.element(by.css('.recipients-to input'));
  this.composerCc = this.composer.element(by.css('.recipients-cc input'));
  this.composerBcc = this.composer.element(by.css('.recipients-bcc input'));
  this.composerSendButton = this.composer.element(by.css('.compose-footer button[type="submit"]'));

};
