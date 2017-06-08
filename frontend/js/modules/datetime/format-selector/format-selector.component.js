(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatetimeFormatSelector', {
      templateUrl: '/views/modules/datetime/format-selector/format-selector',
      bindings: {
        dateFormat: '=',
        timeFormat: '='
      },
      controller: 'esnDatetimeFormatSelectorController'
    });
})(angular);
