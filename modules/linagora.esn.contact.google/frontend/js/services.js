'use strict';

angular.module('linagora.esn.contact.google')
.factory('GoogleContactHelper', function() {
  var isGoogleContact = function(shell) {
    if (shell && shell.addressbook) {
      return shell.addressbook.type === 'google';
    }

    return false;
  };

  return {
    isGoogleContact: isGoogleContact
  };
})

.factory('contactGoogleAddressbookHelper', function() {
  return {
    isGoogleAddressbook: isGoogleAddressbook
  };

  function isGoogleAddressbook(shell) {
    return Boolean(shell && shell.type === 'google');
  }
})

.factory('ContactGoogleAddressbookDisplayShell', function(
  esnI18nService,
  ContactAddressbookDisplayShell
) {
  var GoogleAddressbookDisplayShell = function(shell) {
    this.shell = shell;
    this.icon = 'mdi-google';
    this.displayName = shell.name || esnI18nService.translate('Google contacts').toString();
  };

  GoogleAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

  return GoogleAddressbookDisplayShell;
});
