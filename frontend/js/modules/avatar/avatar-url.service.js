(function() {
  'use strict';

  angular.module('esn.avatar')
    .factory('esnAvatarUrlService', esnAvatarUrlService);

  function esnAvatarUrlService(urlUtils) {
    return {
      generateUrl: generateUrl,
      generateForCurrentUser: generateForCurrentUser,
      generateUrlByUserEmail: generateUrlByUserEmail,
      generateUrlByUserId: generateUrlByUserId
    };

    function generateUrl(email, displayName) {
      return generateUrlByUserEmail(email) + '&objectType=email' + (displayName ? '&displayName=' + displayName : '');
    }

    function generateForCurrentUser(noCache) {
      return applyTimestamp('/api/user/profile/avatar', noCache);
    }

    function generateUrlByUserEmail(email, noCache) {
      return applyTimestamp('/api/avatars?email=' + email, noCache);
    }

    function generateUrlByUserId(userId, noCache) {
      return applyTimestamp('/api/users/' + userId + '/profile/avatar', noCache);
    }

    function applyTimestamp(url, apply) {
      if (apply) {
        return urlUtils.updateUrlParameter(url, 'cb', Date.now());
      }

      return url;
    }
  }
})();
