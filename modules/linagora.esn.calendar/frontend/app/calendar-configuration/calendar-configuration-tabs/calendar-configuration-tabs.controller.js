(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarConfigurationTabsController', CalendarConfigurationTabsController);

  function CalendarConfigurationTabsController(
    calUIAuthorizationService,
    session
  ) {
    var self = this;

    self.canShowDelegationTab = canShowDelegationTab;

    ////////////

    function canShowDelegationTab() {
      return !self.newCalendar && calUIAuthorizationService.canShowDelegationTab(self.calendar, session.user._id);
    }
  }
})();
