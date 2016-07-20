'use strict';

var q = require('q');

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {
  var vacationContent = mainPanel.element(by.css('.inbox-configuration-vacation'));
  var toggleButton = vacationContent.element(by.css('.toggle-switch label'));
  var isEnabledCheckbox = vacationContent.element(by.css('[ng-model="vacation.isEnabled"] input'));
  var hasToDateCheckbox = vacationContent.element(by.model('vacation.hasToDate'));
  var startDateInput = vacationContent.element(by.css('.from-date'));
  var endDateInput = vacationContent.element(by.css('.to-date'));
  var bodyInput = vacationContent.element(by.model('vacation.textBody'));

  function toggleEnable(isEnabled) {
    return isEnabledCheckbox.isSelected().then(function(selected) {
      if (selected !== isEnabled) {
        return toggleButton.click();
      }
    });
  }

  function uncheckHasToDateCheckbox() {
    return hasToDateCheckbox.getAttribute('checked').then(function(checked) {
      if (checked) {
        return hasToDateCheckbox.click();
      } else {
        return q.when();
      }
    });
  }

  function fillStartDate(date) {
    return _clearThenFill(startDateInput, date);
  }

  function fillEndDate(date) {
    return _clearThenFill(endDateInput, date);
  }

  function fillBody(body) {
    return _clearThenFill(bodyInput, body);
  }

  function _clearThenFill(inputElement, data) {
    return inputElement.clear().then(function() {
      return inputElement.sendKeys(data);
    });
  }

  return {
    toggleEnable: toggleEnable,
    uncheckHasToDateCheckbox: uncheckHasToDateCheckbox,
    fillStartDate: fillStartDate,
    fillEndDate: fillEndDate,
    fillBody: fillBody
  };

};
