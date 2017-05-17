(function() {
'use strict';

  angular.module('esn.calendar')
    .controller('CalCalendarPublicConfigurationItemController', CalCalendarPublicConfigurationItemController);

  function CalCalendarPublicConfigurationItemController() {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      console.log(self.item.calendar);
    }
  }
})();
