(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookDisplayService', contactAddressbookDisplayService);

  function contactAddressbookDisplayService(
    _,
    contactAddressbookDisplayShellRegistry,
    ContactAddressbookDisplayShell
  ) {

    return {
      buildAddressbookDisplayShells: buildAddressbookDisplayShells,
      buildDisplayName: buildDisplayName
    };

    function buildAddressbookDisplayShells(addressbooks) {
      var addressbookDisplayShells = [];
      var registeredDisplayShells = _getRegisteredDisplayShells();
      var unregisteredAddressbooks = registeredDisplayShells.reduce(function(list, shell) {
        var matches = list.filter(shell.matchingFunction);

        matches.forEach(function(addressbook) {
          addressbookDisplayShells.push(new shell.displayShell(addressbook));
        });

        return _.xor(matches, list);
      }, addressbooks);

      unregisteredAddressbooks.forEach(function(addressbook) {
        addressbookDisplayShells.push(new ContactAddressbookDisplayShell(addressbook));
      });

      return addressbookDisplayShells;
    }

    function buildDisplayName(addressbook) {
      var registeredDisplayShells = _getRegisteredDisplayShells();
      var matchedShell = _.find(registeredDisplayShells, function(shell) {
        return shell.matchingFunction(addressbook);
      });

      if (matchedShell) {
        return new matchedShell.displayShell(addressbook).displayName;
      }

      return addressbook.name || addressbook.bookName;
    }

    function _getRegisteredDisplayShells() {
      function _lowerPriorityFirst(shell1, shell2) {
        return shell1.priority - shell2.priority;
      }

      return _.values(contactAddressbookDisplayShellRegistry.getAll()).sort(_lowerPriorityFirst);
    }
  }
})(angular);
