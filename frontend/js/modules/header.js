'use strict';

angular.module('esn.header', [])

  .constant('MAIN_HEADER', 'main-header-middle-content')

  .constant('SUB_HEADER', 'sub-header-content')

  .constant('SUB_HEADER_HAS_INJECTION_EVENT', 'sub-header:hasInjection')

  .factory('headerService', function($rootScope, dynamicDirectiveService, MAIN_HEADER, SUB_HEADER, SUB_HEADER_HAS_INJECTION_EVENT) {

    function buildDynamicDirective(directiveName, scope) {
      return new dynamicDirectiveService.DynamicDirective(true, directiveName, {scope: scope});
    }

    function changeMainHeaderDisplay(directiveName) {
      var directive = buildDynamicDirective(directiveName);
      dynamicDirectiveService.addInjection(MAIN_HEADER, directive);
    }

    function hasSubHeaderGotInjections() {
      return dynamicDirectiveService.getInjections(SUB_HEADER, {}).length > 0;
    }

    function hasMainHeaderGotInjections() {
      return dynamicDirectiveService.getInjections(MAIN_HEADER, {}).length > 0;
    }

    function changeSubHeaderDisplay(directiveName, scope) {
      var directive = buildDynamicDirective(directiveName, scope);
      dynamicDirectiveService.addInjection(SUB_HEADER, directive);
      $rootScope.$broadcast(SUB_HEADER_HAS_INJECTION_EVENT, hasSubHeaderGotInjections());
    }

    function resetMainHeaderInjection() {
      dynamicDirectiveService.resetInjections(MAIN_HEADER);
    }

    function resetSubHeaderInjection() {
      dynamicDirectiveService.resetInjections(SUB_HEADER);
    }

    return {
      mainHeader: {
        addInjection: changeMainHeaderDisplay,
        resetInjections: resetMainHeaderInjection,
        hasInjections: hasMainHeaderGotInjections
      },
      subHeader: {
        addInjection: changeSubHeaderDisplay,
        resetInjections: resetSubHeaderInjection,
        hasInjections: hasSubHeaderGotInjections
      },
      resetAllInjections: function() {
        resetMainHeaderInjection();
        resetSubHeaderInjection();
      }
    };
  })

  .directive('mainHeaderContent', function() {
    return {
      restrict: 'E',
      template: '<span>OpenPaas</span>',
      replace: true
    };
  })

  .directive('mainHeader', function($rootScope, headerService, dynamicDirectiveService, Fullscreen, SIDEBAR_EVENTS, SUB_HEADER_HAS_INJECTION_EVENT, sideBarService) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/header/header.html',
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

        scope.hasSubHeaderGotInjections = headerService.subHeader.hasInjections();

        scope.$on(SUB_HEADER_HAS_INJECTION_EVENT, function(event, hasInjections) {
          scope.hasSubHeaderGotInjections = hasInjections;
        });
      }
    };
  });
