(function() {
  'use strict';

  angular
    .module('esn.ldap', [
      'esn.http',
      'esn.user',
      'esn.attendee'
    ])

    .constant('LDAP_AUTO_COMPLETE_TEMPLATE_URL', '/views/modules/auto-complete/ldap-auto-complete')

    .factory('ldapAPI', ldapAPI)

    .service('ldapSearchProvider', ldapSearchProvider)

    .run(function(attendeeService, ldapSearchProvider) {
      attendeeService.addProvider(ldapSearchProvider);
    });

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

  function ldapSearchProvider($log, $q, ldapAPI, userUtils, LDAP_AUTO_COMPLETE_TEMPLATE_URL) {
    function searchAttendee(query, limit) {
      var searchOption = {search: query, limit: limit};

      return ldapAPI.searchUsers(searchOption).then(function(restangularResponse) {
        var users = restangularResponse.data;

        users.forEach(function(user) {
          user.id = user._id;
          user.email = user.preferredEmail;
          user.displayName = userUtils.displayNameOf(user);
        });

        return users;
      }, function(error) {
        $log.error('Error while searching users from LDAP: ', error);

        return $q.when([]);
      });
    }

    return {
      searchAttendee: searchAttendee,
      templateUrl: LDAP_AUTO_COMPLETE_TEMPLATE_URL
    };
  }
})();
