(function() {
  'use strict';

  angular.module('esn.avatar')
    .factory('esnAvatarUrlService', esnAvatarUrlService);

  function esnAvatarUrlService() {
    return {
      generateUrl: generateUrl,
      generateUrlByUserEmail: generateUrlByUserEmail,
      generateUrlByUserId: generateUrlByUserId
    };

    function generateUrl(email, displayName) {
      return generateUrlByUserEmail(email) + '&objectType=email' + (displayName ? '&displayName=' + displayName : '');
    }

    function generateUrlByUserEmail(email) {
      return '/api/avatars?email=' + email;
    }

    function generateUrlByUserId(userId) {
      return '/api/users/' + userId + '/profile/avatar';
    }
  }
})();
