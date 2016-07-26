'use strict';

angular.module('linagora.esn.admin', [
  'esn.router',
  'esn.core',
  'esn.session',
  'op.dynamicDirective',
  'esn.subheader',
  'esn.sidebar',
  'esn.async-action'
  ])

  .run(function(dynamicDirectiveService, session) {
    session.ready.then(function() {
      if (session.userIsDomainAdministrator()) {
        var admin = new dynamicDirectiveService.DynamicDirective(true, 'admin-application-menu', { priority: -10 });

        dynamicDirectiveService.addInjection('esn-application-menu', admin);
      }
    });
  });
