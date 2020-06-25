(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .controller('esnDatetimeDatePickerController', esnDatetimeDatePickerController);

  function esnDatetimeDatePickerController($scope, $element, $compile, $timeout, moment, esnDatetimeService) {
    var self = this;

    self.$onInit = $onInit;
    self.onChange = onChange;
    self.onClick = onClick;
    self.onBlur = onBlur;
    self.onFocus = onFocus;

    function $onInit() {
      // Init default value for some props
      self.startWeek = self.startWeek || 1;
      self.autoclose = self.autoclose || 1;

      _handleCustomAttributes();

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
      if (self.uiValue && moment.isMoment(self.uiValue)) {
        self.ngModel = esnDatetimeService.updateObjectToUserTimeZone(self.uiValue.local());
      }
      $timeout(function() {
        self.ngChange && self.ngChange();
      }, 0);
    }

    function onClick() {
      self.ngClick && self.ngClick();
    }

    function onBlur() {
      self.ngBlur && self.ngBlur();
    }

    function onFocus() {
      self.ngFocus && self.ngFocus();
    }

    function _handleCustomAttributes() {
      var input = $element.find('input');

      self.customAttributes = self.customAttributes || {};
      Object.keys(self.customAttributes).forEach(function(attributeKey) {
        if (!input.attr(attributeKey)) {
          input.attr(attributeKey, self.customAttributes[attributeKey]);
        }
      });

      $compile(input[0])($scope);
    }
  }
})(angular);
