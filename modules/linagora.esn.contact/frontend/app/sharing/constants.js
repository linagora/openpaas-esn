(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .constant('CONTACT_SHARING_INVITE_STATUS', {
      NORESPONSE: 1,
      ACCEPTED: 2,
      DECLINED: 3,
      INVALID: 4
    })

    .constant('CONTACT_SHARING_SHARE_ACCESS', {
      NOTSHARED: 0,
      SHAREDOWNER: 1,
      READ: 2,
      READWRITE: 3,
      NOACCESS: 4
    });
})(angular);
