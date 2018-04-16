(function(angular) {
  'use strict';

  angular.module('esn.search')
    .constant('SIGNIFICANT_DIGITS', 3)
    .constant('defaultSpinnerConfiguration', {
      spinnerKey: 'spinnerDefault',
      spinnerConf: {lines: 17, length: 15, width: 7, radius: 33, corners: 1, rotate: 0, direction: 1, color: '#555', speed: 1, trail: 60, shadow: false, hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto', left: 'auto'}
    });

  })(angular);
