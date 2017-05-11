(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .component('controlcenterGeneralHomePage', {
      templateUrl: '/controlcenter/app/general/home-page/home-page',
      bindings: {
        homePage: '=',
        availablePages: '<'
      }
    });
})(angular);
