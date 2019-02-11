'use strict';

angular.module('esn.domain', ['esn.http', 'esn.attendee', 'esn.session', 'esn.user', 'esn.i18n', 'esn.configuration'])
  .factory('domainAPI', function(esnRestangular) {

    return {
      addAdministrators: addAdministrators,
      create: create,
      createMember: createMember,
      get: get,
      getAdministrators: getAdministrators,
      getByName: getByName,
      getMembers: getMembers,
      getMembersHeaders: getMembersHeaders,
      inviteUsers: inviteUsers,
      isManager: isManager,
      list: list,
      removeAdministrator: removeAdministrator,
      update: update
    };

    /**
     * Create domain
     *
     * @param {Object} domain - With attributes:
     * - name (string)          Domain name
     * - company_name (string)  Company name
     * - hostnames (array)      Array of hostnames
     * - administrator (object) Who will be created and become the domain administrator
     *
     * @return {Promise} Resolve on success
     */
    function create(domain) {
      return esnRestangular.one('domains').customPOST(domain);
    }

    /**
     * Update domain.
     *
     * @param {Object} domain - With attributes:
     * - id (String)            Domain id
     * - company_name (string)  New company name
     * - hostnames (Array)      New hostnames
     *
     * @return {Promise} Resolve on success
     */
    function update(domain) {
      return esnRestangular.one('domains', domain.id).customPUT(domain);
    }

    /**
     * List domains
     *
     * @param {Hash} options - Hash with limit (int), offset (int), name (string), hostname(string)
     *
     * @return {Promise} Resolve on success
     */
    function list(options) {
      return esnRestangular.one('domains').get(options);
    }

    /**
     * Get the list of members of a domain.
     *
     * @param {String} id
     * @param {Hash} options - Hash with limit (int), offset (int) and search (string)
     */
    function getMembers(id, options) {
      return esnRestangular.one('domains', id).getList('members', options);
    }

    /**
     * Do a HTTP HEAD request to /domains/:id/members
     *
     * @param {String} id - Domain id
     */
    function getMembersHeaders(id) {
      return esnRestangular.one('domains', id).one('members').head();
    }

    /**
     * Invite users to join a domain
     *
     * @param {String} id
     * @param {Array} emails - Array of emails (string)
     */
    function inviteUsers(id, emails) {
      return esnRestangular.one('domains', id).customPOST(emails, 'invitations');
    }

    /**
    * Check if the current user is the manager of the domain.
    * returns HTTP 200 if OK, HTTP 403 if not manager.
    *
    * @param {String} id - The domain id
    */
    function isManager(id) {
      return esnRestangular.one('domains', id).one('manager').get();
    }

    /**
    * retrieve a domain basic informations
    * returns HTTP 200 if OK, HTTP 403 if not manager.
    *
    * @param {String} id - The domain id
    */
    function get(id) {
      return esnRestangular.one('domains', id).get();
    }

    /**
    * Create domain's member
    *
    * @param {String} domainId - The domain id
    * @param {Object} user - The user object
    */
    function createMember(domainId, user) {
      return esnRestangular.one('domains', domainId).one('members').customPOST(user);
    }

    /**
     * Add domain administrators
     * @param {String} domainId The domain ID
     * @param {Array} userIds   An array of user ID to set as domain administrators
     * @return {Promise}        Resolve on success
     */
    function addAdministrators(domainId, userIds) {
      return esnRestangular.one('domains', domainId).one('administrators').customPOST(userIds);
    }

    /**
     * Get domain administrators
     * @param {String} domainId The domain ID
     */
    function getAdministrators(domainId) {
      return esnRestangular.one('domains', domainId).one('administrators').get();
    }

    /**
     * Remove a administrator from a domain
     * @param  {String} domainId        The domain ID
     * @param  {String} administratorId The administrator ID
     * @return {Promise}                Resolve on success
     */
    function removeAdministrator(domainId, administratorId) {
      return esnRestangular.one('domains', domainId).one('administrators', administratorId).remove();
    }

    /**
     * Get domain by name
     * @param {String} domainName The domain name
     * @return {Promise}          Resolve on success
     */
    function getByName(domainName) {
      var options = { name: domainName };

      return list(options)
        .then(function(response) {
          return response.data ? response.data[0] : null;
        });
    }
});
