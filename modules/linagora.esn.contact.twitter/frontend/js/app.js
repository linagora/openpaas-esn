'use strict';

angular.module('linagora.esn.contact.twitter', [
  'linagora.esn.contact'
])
  .config(function(dynamicDirectiveServiceProvider) {

    function hasTwitterDropDownMenu(scope) {
      return scope.displayShell.getDropDownMenu() === 'twitter-menu-items';
    }
    var dynamicDirective = new dynamicDirectiveServiceProvider.DynamicDirective(hasTwitterDropDownMenu, 'show-twitter-item');

    dynamicDirectiveServiceProvider.addInjection('contact-list-menu-items', dynamicDirective);
  })

  .run(function(
    contactAddressbookActionEdit,
    contactAddressbookActionDelete,
    contactAddressbookDisplayShellRegistry,
    contactTwitterAddressbookHelper,
    ContactTwitterAddressbookDisplayShell,
    DisplayShellProvider,
    TwitterDisplayShell,
    TwitterContactHelper
  ) {
    DisplayShellProvider.addDisplayShell(TwitterDisplayShell, TwitterContactHelper.isTwitterContact);
    contactAddressbookDisplayShellRegistry.add({
      id: 'linagora.esn.contact.twitter',
      priority: 30,
      displayShell: ContactTwitterAddressbookDisplayShell,
      matchingFunction: contactTwitterAddressbookHelper.isTwitterAddressbook,
      actions: [
        contactAddressbookActionEdit,
        contactAddressbookActionDelete
      ]
    });
  });
