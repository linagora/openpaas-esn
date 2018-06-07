'use strict';

angular.module('linagora.esn.contact.google', [
  'linagora.esn.contact'
])
  .config(function(dynamicDirectiveServiceProvider) {

    function hasGoogleDropDownMenu(scope) {
      return scope.displayShell.getDropDownMenu() === 'google-menu-items';
    }
    var dynamicDirective = new dynamicDirectiveServiceProvider.DynamicDirective(hasGoogleDropDownMenu, 'show-google-account');

    dynamicDirectiveServiceProvider.addInjection('contact-list-menu-items', dynamicDirective);
  })

  .run(function(
    contactAddressbookActionEdit,
    contactAddressbookActionDelete,
    contactAddressbookActionExport,
    contactAddressbookDisplayShellRegistry,
    contactGoogleAddressbookHelper,
    ContactGoogleAddressbookDisplayShell,
    DisplayShellProvider,
    GoogleDisplayShell,
    GoogleContactHelper
  ) {
    DisplayShellProvider.addDisplayShell(GoogleDisplayShell, GoogleContactHelper.isGoogleContact);
    contactAddressbookDisplayShellRegistry.add({
      id: 'linagora.esn.contact.google',
      priority: 20,
      displayShell: ContactGoogleAddressbookDisplayShell,
      matchingFunction: contactGoogleAddressbookHelper.isGoogleAddressbook,
      actions: [
        contactAddressbookActionExport,
        contactAddressbookActionEdit,
        contactAddressbookActionDelete
      ]
    });
  });
