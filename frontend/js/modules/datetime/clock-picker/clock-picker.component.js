(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnClockPicker', {
      templateUrl: '/views/modules/datetime/clock-picker/clock-picker.html',
      bindings: {
        ngModel: '=',
        ngChange: '&',
        ngBlur: '&',
        ngDisabled: '=',
        options: '@',
        label: '@',
        placeholder: '@',
        size: '@'
      },
      controller: 'esnDatetimeClockPickerController'
    });
})(angular);
