(function(angular) {
  'use strict';

  angular.module('esn.home-page')
    .component('esnHomePage', {
      templateUrl: '/views/modules/home-page/home-page',
      bindings: {
        homePage: '=',
        availablePages: '<'
      }
    });
})(angular);
