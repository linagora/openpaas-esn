(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactShowSubheader', function() {
      return {
        restrict: 'E',
        templateUrl: '/contact/app/contact/show/contact-show-subheader.html'
      };
    });
})(angular);
