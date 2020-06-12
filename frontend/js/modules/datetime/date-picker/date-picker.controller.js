(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .controller('esnDatetimeDatePickerController', esnDatetimeDatePickerController);

  function esnDatetimeDatePickerController($scope, $timeout, esnDatetimeService) {
    var self = this;

    self.$onInit = $onInit;
    self.onChange = onChange;

    function $onInit() {
      // Watch the change to ngModel & update uiValue accordingly
      var unsubscribeFromWatchNgModel = $scope.$watch(function() {
        return self.ngModel;
      }, function(newValue, oldValue) {
        if (newValue && oldValue && newValue.valueOf() === oldValue.valueOf()) return;
        self.uiValue = esnDatetimeService.updateObjectToBrowserTimeZone(newValue);
      });

      $scope.$on('$destroy', function() {
        unsubscribeFromWatchNgModel();
      });

      self.uiValue = self.ngModel && esnDatetimeService.updateObjectToBrowserTimeZone(self.ngModel);
    }

    function onChange() {
      self.ngModel = esnDatetimeService.updateObjectToUserTimeZone(self.uiValue.local());
      $timeout(function() {
        self.ngChange();
      }, 0);
    }
  }
})(angular);
