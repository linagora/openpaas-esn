(function(angular) {
  'use strict';

  angular.module('esn.business-hours')
    .component('esnBusinessHours', {
      templateUrl: '/views/modules/business-hours/business-hours',
      bindings: {
        businessHours: '='
      },
      controller: 'esnBusinessHoursController'
    });
})(angular);
