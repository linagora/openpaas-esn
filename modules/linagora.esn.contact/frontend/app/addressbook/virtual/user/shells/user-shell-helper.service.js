(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserShellHelper', ContactUserShellHelper);

  function ContactUserShellHelper() {
    return {
      isUser: isUser
    };

    function isUser(shell) {
      // TODO: The test is not good, it must be virtual + have the good id
      return shell && shell.addressbook && shell.addressbook.type === 'virtual';
    }
  }
})(angular);
