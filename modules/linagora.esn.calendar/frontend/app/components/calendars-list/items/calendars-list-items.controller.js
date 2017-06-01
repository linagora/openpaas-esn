(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarsListItemsController', CalendarsListItemsController);

  function CalendarsListItemsController($state) {
    var self = this;

    self.$onInit = $onInit;

    ///////////////

    function $onInit() {
      self.goTo = goTo;
    }

    function goTo(calendarUniqueId) {
      $state.go(self.stateToGo, { calendarUniqueId: calendarUniqueId });
    }
  }
})();
