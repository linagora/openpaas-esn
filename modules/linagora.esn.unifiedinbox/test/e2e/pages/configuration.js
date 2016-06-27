'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;
var vacationTab = require('./configuration-vacation')();

module.exports = function() {
  var configurationTab = mainPanel.element(by.css('.configuration .configuration-header'));
  var foldersTabButton = configurationTab.element(by.css('[ui-sref="unifiedinbox.configuration.folders"]'));
  var vacationTabButton = configurationTab.element(by.css('[ui-sref="unifiedinbox.configuration.vacation"]'));

  function goToTab(label) {
    if (label === 'Folders') {
      return foldersTabButton.click();
    } else if (label === 'Vacation') {
      return vacationTabButton.click();
    } else {
      throw new Error('No such configuration tab: ' + label);
    }
  }

  return {
    goToTab: goToTab,
    vacationTab: vacationTab
  };
};
