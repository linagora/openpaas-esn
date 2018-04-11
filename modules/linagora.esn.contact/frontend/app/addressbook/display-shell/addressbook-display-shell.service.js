(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactAddressbookDisplayShell', function() {
      function ContactAddressbookDisplayShell(shell) {
        if (shell) {
          this.shell = shell;
          this.icon = 'mdi-folder-outline';
          this.displayName = shell.name || shell.bookName;
        }
      }

      return ContactAddressbookDisplayShell;
    });
})(angular);
