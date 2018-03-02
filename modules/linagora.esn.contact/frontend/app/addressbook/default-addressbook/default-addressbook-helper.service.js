(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactDefaultAddressbookHelper', contactDefaultAddressbookHelper);

  function contactDefaultAddressbookHelper() {
    var isDefaultAddressbook = function(shell) {
      return Boolean(shell && shell.bookName === 'contacts');
    };

    return {
      isDefaultAddressbook: isDefaultAddressbook
    };
  }
})(angular);
