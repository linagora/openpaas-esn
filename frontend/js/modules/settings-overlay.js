'use strict';

angular.module('esn.settings-overlay', [])

  .directive('settingsOverlaySref', function($compile, $rootScope) {
    return {
      restrict: 'A',
      controller: function($scope, $attrs) {
        $scope.settingsOverlaySref = $attrs.settingsOverlaySref;
      },
      link: function(scope, element) {
        var overlay = $compile('<settings-overlay />')(scope);

        element
          .append(overlay)
          .mouseenter(function() {
            if (!$rootScope.esnIsDragging) {
              overlay.show();
            }
          })
          .mouseleave(function() {
            overlay.hide();
          });

        overlay
          .hide()
          .click(function(event) { event.stopImmediatePropagation(); });
      }
    };
  })

  .directive('settingsOverlay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/settings-overlay/template.html'
    };
  });
