(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactEditSubheader', function() {
      return {
        restrict: 'E',
        templateUrl: '/contact/app/contact/edit/contact-edit-subheader.html'
      };
    });
})(angular);
