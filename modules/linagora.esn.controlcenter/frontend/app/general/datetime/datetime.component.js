(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .component('controlcenterGeneralDatetime', {
      templateUrl: '/controlcenter/app/general/datetime/datetime',
      bindings: {
        datetime: '='
      }
    });
})(angular);
