'use strict';

angular.module('linagora.esn.signup', [
  'ngRoute',
  'op.dynamicDirective',
  'esn.invitation',
  'esn.lodash-wrapper',
  'esn.login',
  'esn.notification'
])

  .config(function(dynamicDirectiveServiceProvider) {
    dynamicDirectiveServiceProvider.addInjection('esn-signup-form', new dynamicDirectiveServiceProvider.DynamicDirective(true, 'signup-form'));
  })

  .config(function($routeProvider) {
    $routeProvider
      .when('/confirm', {
        template: '<signup-confirm></signup-confirm>'
      })
      .when('/signup/:id', {
        template: '<signup-finalize></signup-finalize>'
      });
  });
