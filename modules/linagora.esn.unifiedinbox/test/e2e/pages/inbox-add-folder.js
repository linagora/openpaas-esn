'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {

  this.addFolderConfiguration = mainPanel.element(by.css('.configuration.folders-add'));
  this.addFolderName = this.addFolderConfiguration.element(by.model('mailbox.name'));
  this.addFolderParentName = this.addFolderConfiguration.element(by.model('mailbox.parentId'));
  this.createButton = this.addFolderConfiguration.element(by.css('[type="submit"]'));
};
