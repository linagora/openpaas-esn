'use strict';

var mainPanel = new (require('../pages/inbox-panel'))().mainPanel;

module.exports = function() {
  var vacationContent = mainPanel.element(by.css('.inbox-configuration-vacation'));
  var toggleButton = vacationContent.element(by.css('.toggle-switch label'));
  var isEnabledCheckbox = vacationContent.element(by.css('[ng-model="vacation.isEnabled"] input'));
  var hasToDateCheckbox = vacationContent.element(by.model('vacation.hasToDate'));
  var startDateInput = vacationContent.element(by.model('vacation.fromDate'));
  var endDateInput = vacationContent.element(by.model('vacation.toDate'));
  var bodyInput = vacationContent.element(by.model('vacation.textBody'));

  function toggleEnable(isEnabled) {
    return isEnabledCheckbox.isSelected().then(function(selected) {
      if (selected !== isEnabled) {
        return toggleButton.click();
      }
    });
  }

  function clickHasToDateCheckbox() {
    return hasToDateCheckbox.click();
  }

  function fillStartDate(date) {
    return _clearThenFill(startDateInput, date);
  }

  function fillEndDate(date) {
    return _clearThenFill(endDateInput, data);
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
    clickHasToDateCheckbox: clickHasToDateCheckbox,
    fillStartDate: fillStartDate,
    fillEndDate: fillEndDate,
    fillBody: fillBody
  };

};
