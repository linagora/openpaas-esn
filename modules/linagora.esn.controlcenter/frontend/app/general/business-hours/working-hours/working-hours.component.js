(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .component('controlcenterGeneralBusinessHoursWorkingHours', {
      templateUrl: '/controlcenter/app/general/business-hours/working-hours/working-hours',
      bindings: {
        start: '=', // string like 08:40
        end: '='
      },
      controller: 'controlcenterGeneralBusinessHoursWorkingHoursController'
    });
})(angular);
