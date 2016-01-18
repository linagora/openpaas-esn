'use strict';

angular.module('esn.header', ['esn.sidebar'])

  .constant('MAIN_HEADER', 'main-header-middle-content')

  .constant('SUB_HEADER', 'sub-header-content')

  .constant('SUB_HEADER_HAS_INJECTION_EVENT', 'sub-header:hasInjection')

  .factory('headerService', function($rootScope, dynamicDirectiveService, MAIN_HEADER, SUB_HEADER, SUB_HEADER_HAS_INJECTION_EVENT) {

    function buildDynamicDirective(directiveName, scope) {
      return new dynamicDirectiveService.DynamicDirective(true, directiveName, {scope: scope});
    }

    function addMainHeaderInjection(directiveName) {
      var directive = buildDynamicDirective(directiveName);
      dynamicDirectiveService.addInjection(MAIN_HEADER, directive);
    }

    function hasSubHeaderGotInjections() {
      return dynamicDirectiveService.getInjections(SUB_HEADER, {}).length > 0;
    }

    function hasMainHeaderGotInjections() {
      return dynamicDirectiveService.getInjections(MAIN_HEADER, {}).length > 0;
    }

    function addSubHeaderInjection(directiveName, scope) {
      var directive = buildDynamicDirective(directiveName, scope);

      dynamicDirectiveService.addInjection(SUB_HEADER, directive);
      $rootScope.$broadcast(SUB_HEADER_HAS_INJECTION_EVENT, hasSubHeaderGotInjections());
    }

    function setSubHeaderInjection(directiveName, scope) {
      resetSubHeaderInjection();
      addSubHeaderInjection(directiveName, scope);
    }

    function resetMainHeaderInjection() {
      dynamicDirectiveService.resetInjections(MAIN_HEADER);
    }

    function resetSubHeaderInjection() {
      dynamicDirectiveService.resetInjections(SUB_HEADER);
    }

    return {
      mainHeader: {
        addInjection: addMainHeaderInjection,
        resetInjections: resetMainHeaderInjection,
        hasInjections: hasMainHeaderGotInjections
      },
      subHeader: {
        addInjection: addSubHeaderInjection,
        setInjection: setSubHeaderInjection,
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

  .directive('mainHeader', function($rootScope, deviceDetector, headerService, dynamicDirectiveService, Fullscreen, SUB_HEADER_HAS_INJECTION_EVENT) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/header/header.html',
      link: function(scope, element, attrs) {
        scope.$on('header:hide', function() {
          element.addClass('hidden');
        });

        scope.$on('header:show', function() {
          element.removeClass('hidden');
        });

        scope.toggleFullScreen = function() {
          Fullscreen.toggleAll();
        };

        scope.hide = function() {
          element.find('#header').addClass('hide-top');
        };

        scope.show = function() {
          element.find('#header').removeClass('hide-top');
        };

        scope.disableScrollListener = !deviceDetector.isMobile();

        scope.hasSubHeaderGotInjections = headerService.subHeader.hasInjections();

        scope.$on(SUB_HEADER_HAS_INJECTION_EVENT, function(event, hasInjections) {
          scope.hasSubHeaderGotInjections = hasInjections;
        });
      }
    };
  });
