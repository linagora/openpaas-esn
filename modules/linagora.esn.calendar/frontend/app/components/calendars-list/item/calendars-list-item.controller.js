(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarsListItemController', CalendarsListItemController);

  function CalendarsListItemController(userUtils) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.showDetails) {
        getOwnerDisplayName().then(function(ownerDisplayName) {
          self.ownerDisplayName = ownerDisplayName;
        });
      }
    }

    function getOwnerDisplayName() {
      return self.calendar.getOwner().then(userUtils.displayNameOf);
    }
  }
})();
