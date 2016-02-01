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
});
