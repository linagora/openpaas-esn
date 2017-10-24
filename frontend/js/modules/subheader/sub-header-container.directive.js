(function(angular) {
  'use strict';

  angular.module('esn.subheader')

    .directive('subHeaderContainer', function(subHeaderService, matchmedia, ESN_MEDIA_QUERY_SM_XS) {
      return {
        restrict: 'E',
        templateUrl: '/views/modules/subheader/sub-header-container.html',
        link: function(scope, element) {
          var container = element.find('#sub-header');

          subHeaderService.registerContainer(injectHandler, destroyHandler);
          ensureVisible();

          var unregister = matchmedia.on(ESN_MEDIA_QUERY_SM_XS, function() {
            ensureVisible();
          }, scope);

          scope.$on('$destroy', function() {
            unregister();
            subHeaderService.unregisterContainer();
          });

          function hasVisibleElement() {
            return container.children(':visible').length;
          }

          function ensureVisible() {
            container.show();

            if (hasVisibleElement()) {
              subHeaderService.setVisible(true);
            } else {
              container.hide();
              subHeaderService.setVisible(false);
            }
          }

          function injectHandler(content) {
            container.append(content);
            ensureVisible();
          }

          function destroyHandler() {
            ensureVisible();
          }
        }
      };
    });
})(angular);
