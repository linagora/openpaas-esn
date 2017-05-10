(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .component('controlcenterGeneralBusinessHoursWorkingDays', {
      templateUrl: '/controlcenter/app/general/business-hours/working-days/working-days',
      bindings: {
        daysOfWeek: '='
      },
      controller: 'controlcenterGeneralBusinessHoursWorkingDaysController'
    });
})(angular);
