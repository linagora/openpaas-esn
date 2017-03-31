(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarEditDelegationAddUsersController', CalendarEditDelegationAddUsersController);

  function CalendarEditDelegationAddUsersController(
    $stateParams,
    CAL_CALENDAR_SHARED_RIGHT
  ) {
    var self = this;

    self.$onInit = $onInit;

    ////////////

    function $onInit() {
      self.newUsersGroups = $stateParams.newUsersGroups;
      self.delegationTypes = $stateParams.delegationTypes;
      self.selectedShareeRight = CAL_CALENDAR_SHARED_RIGHT.NONE;
    }
  }
})();
