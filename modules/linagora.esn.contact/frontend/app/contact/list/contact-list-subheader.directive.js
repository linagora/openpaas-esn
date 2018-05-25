(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactListSubheader', function() {
      return {
        restrict: 'E',
        templateUrl: '/contact/app/contact/list/contact-list-subheader.html'
      };
    });
})(angular);
