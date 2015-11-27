'use strict';

angular.module('linagora.esn.contact.twitter')
.factory('TwitterContactHelper', function() {
  var isTwitterContact = function(shell) {
    if (shell && shell.social) {
      return shell.social.some(function(element) {
        return (element.type === 'Twitter' && element.value && element.value[0] === '@');
      });
    }
    return false;

  };
  return {
    isTwitterContact: isTwitterContact
  };
});
