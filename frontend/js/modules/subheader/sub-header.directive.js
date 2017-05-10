(function(angular) {
  'use strict';

  angular.module('esn.subheader')

    .directive('subHeader', function(subHeaderService) {
      return {
        // only be used as element to avoid conflict with other directives on transclude
        restrict: 'E',
        transclude: true,
        link: function(scope, element, attrs, ctrl, transclude) {
          transclude(function(transcludedContent, transcludedScope) {
            subHeaderService.inject(transcludedContent);

            scope.$on('$destroy', function() {
              transcludedContent.remove();
              transcludedScope.$destroy();
              subHeaderService.destroy();
            });
          });
        }
      };
    });
})(angular);
