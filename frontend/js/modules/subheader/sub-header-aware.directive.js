(function(angular) {
  'use strict';

  angular.module('esn.subheader')

    .directive('subHeaderAware', function(subHeaderService, SUBHEADER_AWARE_CLASS, SUBHEADER_VISIBLE_EVENT) {
      function link(scope, element) {
        if (subHeaderService.isVisible()) {
          element.addClass(SUBHEADER_AWARE_CLASS);
        }

        scope.$on(SUBHEADER_VISIBLE_EVENT, function(event, visible) {
          element.toggleClass(SUBHEADER_AWARE_CLASS, visible);
        });
      }

      return {
        restrict: 'A',
        link: link
      };
    });

})(angular);
