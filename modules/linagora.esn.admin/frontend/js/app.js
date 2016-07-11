'use strict';

angular.module('linagora.esn.admin', [
  'esn.router',
  'esn.core',
  'esn.session',
  'op.dynamicDirective',
  'esn.subheader',
  'esn.sidebar'
  ])
  .config(function($stateProvider) {
    $stateProvider.state('admin', {
      url: '/admin',
      templateUrl: '/admin/views/index'
    });
  })
  .run(function(dynamicDirectiveService, session) {
    session.ready.then(function() {
      if (session.userIsDomainAdministrator()) {
        var admin = new dynamicDirectiveService.DynamicDirective(true, 'admin-application-menu', { priority: -10 });

        dynamicDirectiveService.addInjection('esn-application-menu', admin);
      }
    });
  });
