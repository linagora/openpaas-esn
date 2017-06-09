(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatetimeForm', {
      templateUrl: '/views/modules/datetime/format-selector/form',
      bindings: {
        exampleDate: '<',
        availableFormats: '<',
        title: '@',
        format: '='
      }
    });
})(angular);
