(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalPublicRightsDisplayController', CalPublicRightsDisplayController);

  function CalPublicRightsDisplayController(CalCalendarRightsUtilsService) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.humanReadable = CalCalendarRightsUtilsService.asHumanReadable(self.right);
    }
  }
})();
