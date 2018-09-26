(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .component('esnDatetime', {
      templateUrl: '/views/modules/datetime/datetime.html',
      bindings: {
        datetime: '=',
        mode: '@'
      }
    });
})(angular);
