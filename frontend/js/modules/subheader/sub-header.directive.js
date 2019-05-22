(function(angular) {
  'use strict';

  angular.module('esn.subheader')

    .directive('subHeader', subHeader);

    function subHeader(subHeaderService, ESN_SUBHEADER_FULLWIDTH_CLASS) {
      return {
        // only be used as element to avoid conflict with other directives on transclude
        restrict: 'E',
        transclude: true,
        link: link
      };

      function link(scope, element, attrs, ctrl, transclude) {
        var options = {
          fullWidth: attrs.fullWidth !== 'false'
        };

        transclude(function(transcludedContent, transcludedScope) {
          if (options.fullWidth) {
            transcludedContent.addClass(ESN_SUBHEADER_FULLWIDTH_CLASS);
          }

          subHeaderService.inject(transcludedContent);

          scope.$on('$destroy', function() {
            transcludedScope.$destroy();
            subHeaderService.destroy();
          });
        });
      }
    }
})(angular);
