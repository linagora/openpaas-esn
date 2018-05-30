(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactCreateSubheader', function() {
      return {
        restrict: 'E',
        templateUrl: '/contact/app/contact/create/contact-create-subheader.html'
      };
    });
})(angular);
