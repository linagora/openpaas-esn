'use strict';

angular.module('linagora.esn.mute', [
  'esn.router',
  'op.dynamicDirective'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('mute', {
        url: '/mute',
        templateUrl: '/mute/views/mute',
        controller: 'muteController'
      })
      
      .state('mutedocument', {
        url: '/mute/:id',
        template: '<mute-iframe />'
      });

    var mute = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-mute', {priority: 45});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', mute);
  });
