'use strict';

angular.module('esn.desktop-utils', ['ng.deviceDetector'])

  .directive('desktopClick', function(deviceDetector) {
    return {
      restrict: 'A',
      scope: {
        desktopClick: '&'
      },
      link: function(scope, element) {
        if (!deviceDetector.isMobile()) {
          element.on('click', function(event) {
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
          element.on('mouseover', function() {
            // We need $apply here, as we are in the middle of a browser DOM event (mouseover/mouseout)
            scope.$apply(function() {
              scope.desktopHover({ hover: true });
            });
          });

          element.on('mouseout', function() {
            scope.$apply(function() {
              scope.desktopHover({ hover: false });
            });
          });
        }
      }
    };
  });
