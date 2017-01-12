(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calendarEditDelegationAddUsers', calendarEditDelegationAddUsers);

  function calendarEditDelegationAddUsers(CALENDAR_RIGHT) {
    return {
      restrict: 'E',
      replace: true,
      controller: 'calendarConfigurationController',
      controllerAs: '$ctrl',
      templateUrl: '/calendar/app/calendar-configuration/calendar-edit-delegation-add-users/calendar-edit-delegation-add-users.html',
      link: function(scope) {
        scope.permission = CALENDAR_RIGHT.NONE;
      }
    };
  }
})();
