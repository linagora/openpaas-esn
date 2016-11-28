'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {

  this.aside = mainPanel.element(by.css('.inbox-aside'));
  this.allMail = this.aside.element(by.css('div[title="All Mail"]'));
};
