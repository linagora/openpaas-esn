(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactGroupAddressbookDisplayShell', ContactGroupAddressbookDisplayShell);

  function ContactGroupAddressbookDisplayShell(ContactAddressbookDisplayShell) {
    var GroupAddressbookDisplayShell = function(shell) {
      this.shell = shell;
      this.icon = 'mdi-book-multiple';
      this.displayName = shell.name || shell.bookName;
    };

    GroupAddressbookDisplayShell.prototype = new ContactAddressbookDisplayShell();

    return GroupAddressbookDisplayShell;
  }
})(angular);
