(function(angular) {
  'use strict';

  angular.module('esn.user')
    .factory('userAPI', userAPI);

  function userAPI(Restangular, esnRestangular, session) {
    return {
      currentUser: currentUser,
      user: user,
      getActivityStreams: getActivityStreams,
      getUsersByEmail: getUsersByEmail,
      setUserEmails: setUserEmails,
      setUserStates: setUserStates,
      provisionUsers: provisionUsers
    };

    function currentUser() {
      return esnRestangular.one('user').get({_: Date.now()});
    }

    function user(uuid) {
      return esnRestangular.one('users', uuid).get();
    }

    function getUsersByEmail(email) {
      return esnRestangular.all('users').getList({ email: email });
    }

    function getActivityStreams(options) {
      options = options || {};

      return esnRestangular.one('user').all('activitystreams').getList(options);
    }

    function setUserStates(userId, states, domainId) {
      return esnRestangular.one('users', userId).customPUT(states, 'states', { domain_id: domainId || session.domain._id });
    }

    /**
     * Set emails of a particular user
     * @param {String} userId   user ID to set emails
     * @param {Array}  emails   an array of emails to set
     * @param {String} domainId domain ID which the user belongs to. If it is not provided, the current domain of modifier will be used.
     */
    function setUserEmails(userId, emails, domainId) {
      return esnRestangular.one('users', userId).customPUT(emails, 'emails', { domain_id: domainId || session.domain._id });
    }

    /**
     * Create or update user from a provision source
     * @param  {String} source The source for users provisioning
     * @param  {Object} data The provisioning data
     * @return {Promise} resolve with the list of provisioned successfully users
     */
    function provisionUsers(source, data) {
      return esnRestangular.all('users').customPOST(data, 'provision', { source: source })
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }
  }
})(angular);
