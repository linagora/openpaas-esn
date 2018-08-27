(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')

    .config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.when('/controlcenter', '/controlcenter/general');

      $stateProvider
        .state('controlcenter', {
          url: '/controlcenter',
          templateUrl: '/controlcenter/app/app'
        })
        .state('controlcenter.general', {
          url: '/general',
          views: {
            'root@controlcenter': {
              template: '<controlcenter-general />'
            }
          }
        });
    });

})(angular);
