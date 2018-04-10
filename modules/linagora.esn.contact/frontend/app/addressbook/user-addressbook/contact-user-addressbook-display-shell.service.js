(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactUserAddressbookDisplayShell', ContactUserAddressbookDisplayShell);

    function ContactUserAddressbookDisplayShell(ContactAddressbookDisplayShell) {
      var UserAddressbookDisplayShell = function(shell) {
        this.shell = shell;
        this.icon = 'mdi-folder';
        this.displayName = shell.name || shell.bookName;
      };

      UserAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

      return UserAddressbookDisplayShell;
    }
})(angular);
