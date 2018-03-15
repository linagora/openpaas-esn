(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(injectContactToApplicationMenu);

  function injectContactToApplicationMenu(dynamicDirectiveService) {
    var contact = new dynamicDirectiveService.DynamicDirective(true, 'application-menu-contact', {priority: 35});

    dynamicDirectiveService.addInjection('esn-application-menu', contact);
  }
})(angular);
