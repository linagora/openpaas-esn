'use strict';

angular.module('esn.header', [])

  .factory('mainHeaderService', function(dynamicDirectiveService) {

    function changeDisplay(directive) {
      dynamicDirectiveService.resetInjection('main-header-middle-content');
      dynamicDirectiveService.addInjection('main-header-middle-content', directive);
    }

    return {
      changeDisplay: changeDisplay
    };
  })

  .directive('mainHeaderContent', function() {
    return {
      restrict: 'E',
      template: '<span>OpenPaas</span>',
      replace: true
    };
  })

  .directive('mainHeader', function($rootScope, mainHeaderService, dynamicDirectiveService, Fullscreen, SIDEBAR_EVENTS, sideBarService) {
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

        scope.hide = function() {
          element.find('#header').addClass('hide-top');
        };

        scope.show = function() {
          element.find('#header').removeClass('hide-top');
        };

        // This is the default directive for the mainHeader.
        var mainHeaderMiddleContent = new dynamicDirectiveService.DynamicDirective(function() {return true;}, 'main-header-content');
        mainHeaderService.changeDisplay(mainHeaderMiddleContent);
      }
    };
  });
