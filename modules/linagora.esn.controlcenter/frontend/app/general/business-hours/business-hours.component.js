(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .component('controlcenterGeneralBusinessHours', {
      templateUrl: '/controlcenter/app/general/business-hours/business-hours',
      bindings: {
        businessHours: '='
      },
      controller: 'controlcenterGeneralBusinessHoursController'
    });
})(angular);
