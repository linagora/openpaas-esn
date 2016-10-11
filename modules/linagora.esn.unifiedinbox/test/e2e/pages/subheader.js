'use strict';

module.exports = function() {
  var subheader = element(by.css('.module-subheader'));
  var saveButton = subheader.element(by.css('inbox-subheader-save-button'));

  function clickButton(label) {
    if (label === 'Save') {
      return saveButton.click();
    } else {
      throw new Error('No such button on Inbox subheader: ' + label);
    }
  }

  return {
    clickButton: clickButton
  };
};
