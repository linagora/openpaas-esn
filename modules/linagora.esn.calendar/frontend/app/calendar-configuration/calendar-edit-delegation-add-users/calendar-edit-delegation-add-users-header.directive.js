(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calendarEditDelegationAddUsersHeader', calendarEditDelegationAddUsersHeader);

  function calendarEditDelegationAddUsersHeader() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/app/calendar-configuration/calendar-edit-delegation-add-users/calendar-edit-delegation-add-users-header.html',
      controller: 'calendarEditionController'
    };
  }
})();
