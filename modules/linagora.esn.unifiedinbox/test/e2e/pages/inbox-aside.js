'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {

  this.aside = mainPanel.element(by.css('.inbox-aside'));
};
