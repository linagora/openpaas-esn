'use strict';

angular.module('linagora.esn.contact.twitter')
.factory('TwitterContactHelper', function() {
  var isTwitterContact = function(shell) {
    if (shell && shell.addressbook) {
      return shell.addressbook.type === 'twitter';
    }

    return false;
  };

  return {
    isTwitterContact: isTwitterContact
  };
})

.factory('contactTwitterAddressbookHelper', function() {
  return {
    isTwitterAddressbook: isTwitterAddressbook
  };

  function isTwitterAddressbook(shell) {
    return Boolean(shell && shell.type === 'twitter');
  }
})

.factory('ContactTwitterAddressbookDisplayShell', function(
  esnI18nService,
  ContactAddressbookDisplayShell
) {
  var TwitterAddressbookDisplayShell = function(shell) {
    this.shell = shell;
    this.icon = 'mdi-twitter';
    this.displayName = shell.name || esnI18nService.translate('Twitter contacts').toString();
  };

  TwitterAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

  return TwitterAddressbookDisplayShell;
});
