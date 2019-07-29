(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').directive('contactSearchSubheader', function() {
    return {
      restrict: 'E',
      templateUrl:
        '/contact/app/search/sub-header/contact-search-subheader.html'
    };
  });
})(angular);
