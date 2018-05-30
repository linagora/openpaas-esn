(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(injectContactToApplicationMenu)
    .run(addContactAttendeeProvider)
    .run(registerContactModuleRegistry)
    .run(setAddressbookCache);

  function injectContactToApplicationMenu(dynamicDirectiveService) {
    var contact = new dynamicDirectiveService.DynamicDirective(true, 'application-menu-contact', {priority: 35});

    dynamicDirectiveService.addInjection('esn-application-menu', contact);
  }

  function addContactAttendeeProvider(attendeeService, ContactAttendeeProvider) {
    attendeeService.addProvider(ContactAttendeeProvider);
  }

  function registerContactModuleRegistry(esnModuleRegistry, CONTACT_MODULE_METADATA) {
    esnModuleRegistry.add(CONTACT_MODULE_METADATA);
  }

  function setAddressbookCache(AddressbookCache, ContactShellBuilder) {
    ContactShellBuilder.setAddressbookCache(AddressbookCache);
  }
})(angular);
