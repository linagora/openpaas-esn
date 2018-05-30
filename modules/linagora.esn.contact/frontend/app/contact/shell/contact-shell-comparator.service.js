(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactShellComparator', ContactShellComparator);

  function ContactShellComparator() {

    return {
      byDisplayName: byDisplayName
    };

    function getAsAlpha(str) {
      return (str && /^[ a-z]+$/i.test(str)) ? str.toLowerCase() : '#';
    }

    function byDisplayName(contact1, contact2) {
      var valueA = getAsAlpha(contact1.displayName);
      var valueB = getAsAlpha(contact2.displayName);

      if (valueA < valueB) {
        return -1;
      }

      if (valueA > valueB) {
        return 1;
      }

      return 0;
    }
  }
})(angular);
