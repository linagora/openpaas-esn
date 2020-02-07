(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .factory('profileHelpersService', profileHelpersService);

  function profileHelpersService(session) {
    return {
      isMe: isMe,
      canEdit: canEdit
    };

    function isMe(user) {
      return session.user._id === user._id;
    }

    function canEdit(user) {
      return isMe(user) || session.userIsDomainAdministrator();
    }
  }
})(angular);
