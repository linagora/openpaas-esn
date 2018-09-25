(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatetimeTimeZoneSelector', {
      templateUrl: '/views/modules/datetime/time-zone-selector/time-zone-selector.html',
      controller: 'esnDatetimeTimeZoneSelectorController',
      bindings: {
        timeZone: '='
      }
    });
})(angular);
