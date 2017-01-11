(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarConfigurationTabs', calendarConfigurationTabs());

  ////////////

  function calendarConfigurationTabs() {
    return {
      templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-tabs/calendar-configuration-tabs.html',
      bindings: {
        selectedTab: '=',
        getMainView: '=',
        isAdmin: '=',
        newCalendar: '=',
        getDelegationView: '='
      },
      controllerAs: '$ctrl'
    };
  }
})();
