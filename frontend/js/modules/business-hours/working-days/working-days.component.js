(function(angular) {
  'use strict';

  angular.module('esn.business-hours')
    .component('esnBusinessHoursWorkingDays', {
      templateUrl: '/views/modules/business-hours/working-days/working-days',
      bindings: {
        daysOfWeek: '='
      },
      controller: 'esnBusinessHoursWorkingDaysController'
    });
})(angular);
