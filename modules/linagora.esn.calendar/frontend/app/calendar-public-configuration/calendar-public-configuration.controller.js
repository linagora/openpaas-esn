(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarPublicConfigurationController', calendarPublicConfigurationController);

  function calendarPublicConfigurationController() {
    var self = this;

    self.users = [];
    self.disableButton = true;

    self.updateButtonDisplay = updateButtonDisplay;

    ////////////

    function updateButtonDisplay() {
      self.disableButton = (self.users.length === 0);
    }
  }
})();
