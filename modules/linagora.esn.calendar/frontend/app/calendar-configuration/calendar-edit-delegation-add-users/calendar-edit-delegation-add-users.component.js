(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarEditDelegationAddUsers', calendarEditDelegationAddUsers());

  function calendarEditDelegationAddUsers() {
    return {
      templateUrl: '/calendar/app/calendar-configuration/calendar-edit-delegation-add-users/calendar-edit-delegation-add-users.html',
      controller: 'CalendarEditDelegationAddUsersController'
    };
  }
})();
