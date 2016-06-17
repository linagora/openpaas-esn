'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel,
    subheader = new (require('../pages/inbox-subheader'))().subheader;

module.exports = function() {

  this.addFolderConfiguration = mainPanel.element(by.css('.configuration.folders-add'));
  this.addFolderName = this.addFolderConfiguration.element(by.model('mailbox.name'));
  this.addFolderParentName = this.addFolderConfiguration.element(by.model('mailbox.parentId'));
  this.createButton = subheader.element(by.css('.save.button'));
};
