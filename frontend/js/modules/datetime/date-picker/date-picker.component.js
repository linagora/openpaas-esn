(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatePicker', {
      templateUrl: '/views/modules/datetime/date-picker/date-picker.html',
      bindings: {
        ngModel: '=',
        ngChange: '&',
        ngBlur: '&',
        ngDisabled: '=',
        options: '@',
        label: '@',
        placeholder: '@',
        size: '@',
        dateFormat: '@',
        isAllDay: '=',
        minDate: '@'
      },
      controller: 'esnDatetimeDatePickerController'
    });
})(angular);
