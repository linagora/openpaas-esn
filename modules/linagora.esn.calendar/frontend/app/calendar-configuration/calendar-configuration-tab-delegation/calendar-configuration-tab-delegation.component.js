(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarConfigurationTabDelegation', calendarConfigurationTabDelegation());

  ////////////

  function calendarConfigurationTabDelegation() {
    return {
      templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-tab-delegation/calendar-configuration-tab-delegation.html',
      bindings: {
        delegationTypes: '<',
        delegations: '=',
        selection: '=',
        publicSelection: '=',
        publicRights: '=',
        goToEditDelegation: '=',
        newUsersGroups: '=',
        addUserGroup: '=',
        removeUserGroup: '=',
        onAddingUser:'='
      },
      controllerAs: '$ctrl'
    };
  }
})();
