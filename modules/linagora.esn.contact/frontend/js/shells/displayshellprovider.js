'use strict';

angular.module('linagora.esn.contact')
  .factory('DisplayShellProvider', function(ContactDisplayShell) {

    var displayShellsRegistered = [];

    function addDisplayShell(displayShell, fnMatchingContact) {
      displayShellsRegistered.push({
        displayShell: displayShell,
        fnMatchingContact: fnMatchingContact
      });
    }

    function resetDisplayShell() {
      displayShellsRegistered = [];
    }

    function toDisplayShell(contactShell) {
      var displayShellMatched = null;

      displayShellsRegistered.some(function(elt) {
        if (elt.fnMatchingContact(contactShell)) {
          displayShellMatched = elt;
          return true;
        }
      });

      if (displayShellMatched) {
        return new displayShellMatched.displayShell(contactShell);
      }

      return new ContactDisplayShell(contactShell);
    }

    return {
      addDisplayShell: addDisplayShell,
      resetDisplayShell: resetDisplayShell,
      toDisplayShell: toDisplayShell
    };
  });
