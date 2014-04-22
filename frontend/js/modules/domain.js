'use strict';

angular.module('esn.domain', ['restangular', 'ngTagsInput'])
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

    /**
    * Check if the current user is the manager of the domain.
    * returns HTTP 200 if OK, HTTP 403 if not manager.
    *
    * @param {String} id - The domain id
    */
    function isManager(id) {
      return Restangular.one('domains', id).one('manager').get();
    }

    return {
      getMembers: getMembers,
      inviteUsers: inviteUsers,
      isManager: isManager
    };
  }])
  .controller('inviteMembers', function($scope, domainAPI, domain) {

    $scope.placeholder = 'Add an email';
    $scope.displayProperty = 'email';
    // Regular expression to check that the input text is a valid email
    // regexp as string, single \ are \\ escaped, doubles \ are \\\ escaped
    // original regexp is
    // var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    $scope.pattern = '^(([^<>()[\\\]\\\\\.,;:\\\s@\\\"]+(\\\.[^<>()[\\\]\\\\\.,;:\s@\\\"]+)*)|(\\\".+\\\"))@((\\\[[0-9]{1,3}\\\.[0-9]{1,3}\\\.[0-9]{1,3}\\\.[0-9]{1,3}\\\])|(([a-zA-Z\-0-9]+\\\.)+[a-zA-Z]{2,}))$'; // jshint ignore:line
    $scope.step = 0;
    $scope.domain = domain.name;
    $scope.emails = [];

    $scope.invite = function() {
      var emails = $scope.emails.map(function(element) {
        return element.email;
      });

      domainAPI.inviteUsers(domain._id, emails).then(
        function(data) {
          $scope.error = undefined;
          $scope.step = 1;
        },
        function(err) {
          $scope.error = err;
        }
      );
    };
  });
