(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatetimeTimeFormatSelector', {
      templateUrl: '/views/modules/datetime/timeformat-selector/timeformat-selector.html',
      bindings: {
        use24hourFormat: '='
      },
      controller: 'esnDatetimeTimeFormatSelectorController'
    });
})(angular);
