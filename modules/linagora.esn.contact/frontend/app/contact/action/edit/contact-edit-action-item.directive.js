(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactEditActionItem', function() {
      return {
        restrict: 'E',
        replace: true,
        templateUrl: '/contact/app/contact/action/edit/contact-edit-action-item.html'
      };
    });
})(angular);
