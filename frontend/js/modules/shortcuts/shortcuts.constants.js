(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .constant('ESN_SHORTCUTS_DEFAULT_CATEGORY', {
      id: '_',
      name: 'Global shortcuts',
      moduleDetector: true // Boolean, RegExp or Function
    });
})(angular);
