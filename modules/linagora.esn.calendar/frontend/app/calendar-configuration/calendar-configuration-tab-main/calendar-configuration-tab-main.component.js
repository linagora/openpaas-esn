(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarConfigurationTabMain', calendarConfigurationTabMain());

  ////////////

  function calendarConfigurationTabMain() {
    return {
      templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-tab-main/calendar-configuration-tab-main.html',
      bindings: {
        calendar: '=',
        newCalendar: '=',
        isDefaultCalendar: '=',
        openDeleteConfirmationDialog: '=',
        mobileCancel: '=',
        cancel: '=',
        submit: '='
      },
      controllerAs: '$ctrl'
    };
  }
})();
