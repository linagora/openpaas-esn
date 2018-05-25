(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactDeleteActionItem', function() {
      return {
        restrict: 'E',
        replace: true,
        templateUrl: '/contact/app/contact/action/delete/contact-delete-action-item.html'
      };
    });
})(angular);
