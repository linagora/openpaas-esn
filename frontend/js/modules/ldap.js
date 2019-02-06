(function() {
  'use strict';

  angular
    .module('esn.ldap', [
      'esn.http',
      'esn.user',
      'esn.attendee'
    ])

    .factory('ldapAPI', ldapAPI);

  function ldapAPI(esnRestangular) {
    /**
     * Get the list of ldap's user.
     *
     * @param {Hash} options - Hash with limit (int), and search (string)
     */
    function searchUsers(options) {
      return esnRestangular.one('ldap').getList('search', options);
    }

    return {
      searchUsers: searchUsers
    };
  }
})();
