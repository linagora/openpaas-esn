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
      NOACCESS: 4,
      READWRITEADMIN: 5
    })

    .constant('CONTACT_SHARING_SHARE_ACCESS_CHOICES', {
      READ: {
        value: 2,
        label: 'Read',
        longLabel: 'See all contacts',
        score: 1
      },
      READWRITE: {
        value: 3,
        label: 'Read/Write',
        longLabel: 'Edit all contacts',
        score: 2
      },
      READWRITEADMIN: {
        value: 5,
        label: 'Administration',
        longLabel: 'Edit contacts and manage sharing',
        score: 3
      }
    })

    .constant('CONTACT_SHARING_SUBSCRIPTION_TYPE', {
      delegation: 'delegation',
      public: 'public'
    })

    .constant('CONTACT_SHARING_SHARE_PRIVILEGE', '{DAV:}share');
})(angular);
