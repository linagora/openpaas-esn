(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactPhoto', contactPhoto);

  function contactPhoto(
    ContactShellDisplayBuilder,
    CONTACT_DEFAULT_AVATAR
  ) {
    return {
      restrict: 'E',
      templateUrl: '/contact/app/contact/photo/contact-photo.html',
      scope: {
        contact: '=',
        editable: '@',
        listView: '@',
        avatarSize: '@',
        contactState: '@'
      },
      link: function(scope) {
        scope.defaultAvatar = CONTACT_DEFAULT_AVATAR;
        scope.displayShell = ContactShellDisplayBuilder.build(scope.contact);
      }
    };
  }
})(angular);
