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
    })

    .constant('CONTACT_SHARING_SHARE_ACCESS_CHOICES', {
      READ: {
        value: 2,
        label: 'Read',
        longLabel: 'See all contacts'
      },
      READWRITE: {
        value: 3,
        label: 'Read/Write',
        longLabel: 'Edit all contacts'
      }
    });
})(angular);
