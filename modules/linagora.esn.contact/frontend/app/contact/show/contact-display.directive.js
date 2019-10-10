(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactDisplay', contactDisplay);

  function contactDisplay(
    $state,
    ContactsHelper,
    ContactShellDisplayBuilder,
    CONTACT_AVATAR_SIZE
  ) {
    return {
      restrict: 'E',
      scope: {
        contact: '='
      },
      templateUrl: '/contact/app/contact/show/contact-display.html',
      link: function($scope) {

        $scope.displayShell = ContactShellDisplayBuilder.build($scope.contact);
        $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
        ContactsHelper.fillScopeContactData($scope, $scope.contact);

        $scope.hasContactInformation = function() {
          return ($scope.contact.emails && $scope.contact.emails.length > 0) ||
                 ($scope.contact.tel && $scope.contact.tel.length > 0) ||
                 ($scope.contact.addresses && $scope.contact.addresses.length > 0) ||
                 ($scope.contact.social && $scope.contact.social.length > 0) ||
                 ($scope.contact.urls && $scope.contact.urls.length > 0);
        };

        $scope.hasProfileInformation = function() {
          return !!($scope.contact.firstName ||
                    $scope.contact.lastName ||
                    $scope.contact.nickname ||
                    $scope.contact.birthday);
        };

        $scope.shouldDisplayWork = function() {
          return !!($scope.contact.orgName || $scope.contact.orgRole);
        };

        $scope.openAddressbook = function() {
          $state.go('contact.addressbooks', {
            bookId: $scope.contact.addressbook.bookId,
            bookName: $scope.contact.addressbook.bookName
          });
        };
      }
    };
  }
})(angular);
