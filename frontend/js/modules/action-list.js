'use strict';

angular.module('esn.actionList', [])

  .directive('actionList', function($modal, $dropdown, screenSize) {
    return {
      restrict: 'A',
      scope: {
        templateMobileUrl: '@',
        templateDesktopUrl: '@'
      },
      link: function(scope, element) {

        scope.close = function() {
          if (scope.opened) {
            scope.opened.destroy();
          }
        };

        function openForMobile() {
          scope.close();
          scope.opened = $modal({scope: scope, templateUrl: scope.templateMobileUrl, placement: 'center'});
        }

        function openForDesktop() {
          scope.close();
          scope.opened = $dropdown(element, {scope: scope, trigger: 'manual', show: true, templateUrl: scope.templateDesktopUrl});
        }

        function handleWindowResizement() {
          if (scope.opened.$isShown) {
            boundOpenFn();
          }
        }

        var boundOpenFn = screenSize.get() === 'xs' ? openForMobile : openForDesktop;

        screenSize.on('xs', function(match) {
          if (match && boundOpenFn === openForDesktop) {
            boundOpenFn = openForMobile;
            handleWindowResizement();
          } else if (!match && boundOpenFn === openForMobile) {
            boundOpenFn = openForDesktop;
            handleWindowResizement();
          }
        });

        element.click(function() {
          boundOpenFn();
        });

      }
    };
  });
