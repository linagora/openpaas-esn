'use strict';

angular.module('esn.domain', ['restangular'])
  .factory('domainAPI', ['Restangular', function(Restangular) {

    /**
     * Get the list of members of a domain.
     *
     * @param {String} id
     * @param {Hash} options - Hash with limit (int), offset (int) and search (string)
     */
    function getMembers(id, options) {
      return Restangular.one('domains', id).getList('members', options);
    }

    /**
     * Invite users to join a domain
     *
     * @param {String} id
     * @param {Array} emails - Array of emails (string)
     */
    function inviteUsers(id, emails) {
      return Restangular.one('domains', id).customPOST(emails, 'invitations');
    }

    return {
      getMembers: getMembers,
      inviteUsers: inviteUsers
    };
  }]);
