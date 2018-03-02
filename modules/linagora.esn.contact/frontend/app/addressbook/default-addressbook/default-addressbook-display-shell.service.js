(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactDefaultAddressbookDisplayShell', function(ContactAddressbookDisplayShell) {
      var ContactDefaultAddressbookDisplayShell = function(shell) {
        this.shell = shell;
        this.icon = 'mdi-contacts';
        this.displayName = 'My contacts';
      };

      ContactDefaultAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

      return ContactDefaultAddressbookDisplayShell;
    });

})(angular);
