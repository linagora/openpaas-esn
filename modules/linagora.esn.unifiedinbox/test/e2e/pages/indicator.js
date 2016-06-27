'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {

  var indicator = mainPanel.element(by.css('inbox-vacation-indicator'));

  function isPresent() {
    return indicator.isPresent();
  }

  return {
    isPresent: isPresent
  };
};
