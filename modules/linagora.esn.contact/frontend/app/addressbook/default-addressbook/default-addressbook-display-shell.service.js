(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactDefaultAddressbookDisplayShell', function(
      esnI18nService,
      ContactAddressbookDisplayShell
    ) {
      var ContactDefaultAddressbookDisplayShell = function(shell) {
        this.shell = shell;
        this.icon = 'mdi-folder-account';

        this.displayName = shell.name || esnI18nService.translate('My contacts').toString();
      };

      ContactDefaultAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

      return ContactDefaultAddressbookDisplayShell;
    });

})(angular);
