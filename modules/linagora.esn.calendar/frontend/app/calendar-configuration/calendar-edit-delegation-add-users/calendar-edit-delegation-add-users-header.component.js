(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarEditDelegationAddUsersHeader', calendarEditDelegationAddUsersHeader());

  function calendarEditDelegationAddUsersHeader() {
    return {
      templateUrl: '/calendar/app/calendar-configuration/calendar-edit-delegation-add-users/calendar-edit-delegation-add-users-header.html',
      bindings: {
        newUsersGroups: '=',
        selection: '='
      }
    };
  }
})();
