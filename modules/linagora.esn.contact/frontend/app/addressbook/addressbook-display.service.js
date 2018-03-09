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
      convertShellToDisplayShell: convertShellToDisplayShell,
      convertShellsToDisplayShells: convertShellsToDisplayShells,
      sortAddressbookDisplayShells: sortAddressbookDisplayShells,
      buildDisplayName: buildDisplayName
    };

    function convertShellsToDisplayShells(addressbookShells, options) {
      options = options || {};

      return addressbookShells.map(function(addressbookShell) {
        return convertShellToDisplayShell(addressbookShell, options);
      });
    }

    function convertShellToDisplayShell(addressbookShell, options) {
      options = options || {};
      var match = _.find(_getRegisteredDisplayShells(), function(displayShell) {
        return displayShell.matchingFunction(addressbookShell);
      });
      var addressbookDisplayShell;

      if (match) {
        addressbookDisplayShell = new match.displayShell(addressbookShell);

        if (options.includeActions) {
          addressbookDisplayShell.actions = match.actions || [];
        }

        if (options.includePriority) {
          addressbookDisplayShell.priority = match.priority;
        }

        return addressbookDisplayShell;
      }

      return new ContactAddressbookDisplayShell(addressbookShell);
    }

    function sortAddressbookDisplayShells(addressbookDisplayShells) {
      return addressbookDisplayShells.sort(function(displayShell1, displayShell2) {
        if (displayShell1.priority === displayShell2.priority) {
          return displayShell1.displayName.localeCompare(displayShell2.displayName);
        }

        return displayShell1.priority - displayShell2.priority;
      });
    }

    function buildDisplayName(addressbook) {
      var matchedShell = _.find(_getRegisteredDisplayShells(), function(shell) {
        return shell.matchingFunction(addressbook);
      });

      if (matchedShell) {
        return new matchedShell.displayShell(addressbook).displayName;
      }

      return addressbook.name || addressbook.bookName;
    }

    function _getRegisteredDisplayShells() {
      return _.values(contactAddressbookDisplayShellRegistry.getAll());
    }
  }
})(angular);
