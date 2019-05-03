(function(angular) {
  'use strict';

  angular.module('esn.user')
    .factory('userAPI', userAPI);

  function userAPI(esnRestangular, session) {
    return {
      currentUser: currentUser,
      user: user,
      getCommunities: getCommunities,
      getActivityStreams: getActivityStreams,
      getUsersByEmail: getUsersByEmail,
      setUserStates: setUserStates
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

    function getCommunities() {
      return esnRestangular.one('user').all('communities').getList();
    }

    function getActivityStreams(options) {
      options = options || {};

      return esnRestangular.one('user').all('activitystreams').getList(options);
    }

    function setUserStates(userId, states, domainId) {
      return esnRestangular.one('users', userId).customPUT(states, 'states', { domain_id: domainId || session.domain._id });
    }
  }
})(angular);
