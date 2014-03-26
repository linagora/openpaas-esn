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

    return {
      getMembers: getMembers
    };
  }]);
