'use strict';

angular.module('esn.header', [])

  .directive('esnHeader', function($rootScope, Fullscreen, SIDEBAR_EVENTS, sideBarService) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/esn/partials/header.html',
      link: function(scope, element, attrs) {

        function open() {
          if (sideBarService.isLeftSideBarOpen()) {
            return;
          }
          element.find('#menu-trigger').addClass('open');
        }

        function close() {
          if (!sideBarService.isLeftSideBarOpen()) {
            return;
          }
          element.find('#menu-trigger').removeClass('open');
        }

        var unregister = $rootScope.$on(SIDEBAR_EVENTS.display, function(evt, data) {
          return data.display ? open() : close();
        });

        scope.$on('$destroy', unregister);

        scope.toggleFullScreen = function() {
          Fullscreen.toggleAll();
        };
      }
    };
  });
