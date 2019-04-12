(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);

  function runBlock(
    dynamicDirectiveService,
    attendeeService,
    ContactAttendeeProvider,
    AddressbookCache,
    ContactShellBuilder,
    contactConfiguration
  ) {
    contactConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      var contact = new dynamicDirectiveService.DynamicDirective(true, 'application-menu-contact', {
        priority: 35
      });

      dynamicDirectiveService.addInjection('esn-application-menu', contact);
      attendeeService.addProvider(ContactAttendeeProvider);
      ContactShellBuilder.setAddressbookCache(AddressbookCache);
    });
  }
})(angular);
