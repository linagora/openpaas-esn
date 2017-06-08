(function(angular) {
  'use strict';

  angular.module('esn.business-hours')
    .component('esnBusinessHoursWorkingHours', {
      templateUrl: '/views/modules/business-hours/working-hours/working-hours',
      bindings: {
        start: '=', // string like 08:40
        end: '='
      },
      controller: 'esnBusinessHoursWorkingHoursController'
    });
})(angular);
