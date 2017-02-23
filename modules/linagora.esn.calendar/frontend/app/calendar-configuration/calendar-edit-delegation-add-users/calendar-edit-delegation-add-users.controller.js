(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarEditDelegationAddUsersController', CalendarEditDelegationAddUsersController);

  function CalendarEditDelegationAddUsersController(
    $stateParams,
    CALENDAR_RIGHT
  ) {
    var self = this;

    self.$onInit = $onInit;

    ////////////

    function $onInit() {
      self.newUsersGroups = $stateParams.newUsersGroups;
      self.delegationTypes = $stateParams.delegationTypes;
      self.selection = CALENDAR_RIGHT.NONE;
    }
  }
})();
