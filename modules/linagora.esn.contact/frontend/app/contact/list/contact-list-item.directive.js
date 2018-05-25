(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactListItem', contactListItem);

  function contactListItem(
    ContactShellDisplayBuilder,
    CONTACT_AVATAR_SIZE
  ) {
    return {
      restrict: 'E',
      templateUrl: '/contact/app/contact/list/contact-list-item.html',
      scope: {
        contact: '=',
        avatarSize: '@'
      },
      controller: 'contactItemController',
      link: {
        // We do translation in pre-link to execute it before the dynamic directive injection
        pre: function(scope) {
          scope.displayShell = ContactShellDisplayBuilder.build(scope.contact);
          scope.avatarSize = scope.avatarSize ? scope.avatarSize : CONTACT_AVATAR_SIZE.list;
        }
      }
    };
  }
})(angular);
