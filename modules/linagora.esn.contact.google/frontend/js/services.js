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
});
