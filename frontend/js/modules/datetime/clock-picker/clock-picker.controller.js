(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .controller('esnDatetimeClockPickerController', esnDatetimeClockPickerController);

  function esnDatetimeClockPickerController($timeout, esnDatetimeService) {
    var self = this;

    self.$onInit = $onInit;
    self.onChange = onChange;

    function $onInit() {
      self.uiValue = self.ngModel && esnDatetimeService.updateObjectToBrowserTimeZone(self.ngModel);
    }

    function onChange() {
      self.ngModel = esnDatetimeService.updateObjectToUserTimeZone(self.uiValue);
      $timeout(function() {
        self.ngChange();
      }, 0);
    }
  }
})(angular);
