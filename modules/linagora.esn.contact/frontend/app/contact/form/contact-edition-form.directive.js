(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactEditionForm', contactEditionForm);

  function contactEditionForm(
    contactAddressbookDisplayService,
    contactAddressbookService,
    CONTACT_ATTRIBUTES_ORDER,
    CONTACT_AVATAR_SIZE
  ) {
    return {
      restrict: 'E',
      scope: {
        contact: '=',
        bookName: '=',
        contactState: '@'
      },
      templateUrl: '/contact/app/contact/form/contact-edition-form.html',
      link: function($scope) {
        $scope.CONTACT_ATTRIBUTES_ORDER = CONTACT_ATTRIBUTES_ORDER;
        $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;

        contactAddressbookService.listAddressbooksUserCanCreateContact().then(function(addressbooks) {
          var addressbookDisplayShells = contactAddressbookDisplayService.convertShellsToDisplayShells(addressbooks, { includePriority: true });

          $scope.availableAddressbookDisplayShells = contactAddressbookDisplayService.sortAddressbookDisplayShells(addressbookDisplayShells);
        });
      }
    };
  }
})(angular);
