(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatePicker', {
      templateUrl: '/views/modules/datetime/date-picker/date-picker.html',
      bindings: {
        ngModel: '=',
        ngChange: '&',
        ngBlur: '&',
        ngFocus: '&',
        ngClick: '&',
        className: '@',
        ngDisabled: '=',
        options: '@',
        label: '@',
        placeholder: '@',
        size: '@',
        isAllDay: '=',
        minDate: '@',
        dateFormat: '@',
        autoclose: '@',
        startWeek: '@',
        customAttributes: '<'
      },
      controller: 'esnDatetimeDatePickerController'
    });
})(angular);
