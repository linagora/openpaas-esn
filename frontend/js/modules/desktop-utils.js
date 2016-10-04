'use strict';

angular.module('esn.desktop-utils', ['ng.deviceDetector'])
  .constant('KEYCODES', {
    TAB_KEY: 9,
    ENTER: 13
  })

  .directive('desktopClick', function(deviceDetector) {
    return {
      restrict: 'A',
      scope: {
        desktopClick: '&'
      },
      link: function(scope, element) {
        if (!deviceDetector.isMobile()) {
          element.on('click', function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();

            scope.desktopClick({ event: event });
          });
        }
      }
    };
  })

  .directive('desktopHover', function(deviceDetector) {
    return {
      restrict: 'A',
      scope: {
        desktopHover: '&'
      },
      link: function(scope, element) {
        if (!deviceDetector.isMobile()) {
          element.on('mouseenter', function() {
            // We need $apply here, as we are in the middle of a browser DOM event (mouseenter/mouseleave)
            scope.$apply(function() {
              scope.desktopHover({ hover: true });
            });
          });

          element.on('mouseleave', function() {
            scope.$apply(function() {
              scope.desktopHover({ hover: false });
            });
          });
        }
      }
    };
  });
