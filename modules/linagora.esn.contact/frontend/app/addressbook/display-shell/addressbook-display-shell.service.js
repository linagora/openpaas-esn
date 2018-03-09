(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactAddressbookDisplayShell', function() {
      function ContactAddressbookDisplayShell(shell) {
        if (shell) {
          this.shell = shell;
          this.icon = 'mdi-folder';
          this.displayName = shell.name || shell.bookName;
        }
      }

      ContactAddressbookDisplayShell.prototype.isWritable = function() {
        return this.shell.editable;
      };

      return ContactAddressbookDisplayShell;
    });
})(angular);
