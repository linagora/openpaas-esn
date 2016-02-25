'use strict';

angular.module('esn.header', ['esn.sidebar', 'matchMedia'])

  .constant('MAIN_HEADER', 'main-header-middle-content')

  .constant('SUB_HEADER', 'sub-header-content')

  .constant('SUB_HEADER_HAS_INJECTION_EVENT', 'sub-header:hasInjection')

  .constant('SUB_HEADER_VISIBLE_MD_EVENT', 'sub-header:visibleMd')

  .constant('SUB_HEADER_HEIGHT_IN_PX', 47)

  .factory('headerService', function($rootScope, dynamicDirectiveService, MAIN_HEADER, SUB_HEADER, SUB_HEADER_HAS_INJECTION_EVENT, SUB_HEADER_VISIBLE_MD_EVENT) {

    function buildDynamicDirective(directiveName, scope) {
      return new dynamicDirectiveService.DynamicDirective(true, directiveName, {scope: scope});
    }

    function addMainHeaderInjection(directiveName) {
      var directive = buildDynamicDirective(directiveName);
      dynamicDirectiveService.addInjection(MAIN_HEADER, directive);
    }

    function hasMainHeaderGotInjections() {
      return dynamicDirectiveService.getInjections(MAIN_HEADER, {}).length > 0;
    }

    function hasSubHeaderGotInjections() {
      return dynamicDirectiveService.getInjections(SUB_HEADER, {}).length > 0;
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

    function setVisibleMD() {
      $rootScope.$broadcast(SUB_HEADER_VISIBLE_MD_EVENT, true);
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
        hasInjections: hasSubHeaderGotInjections,
        setVisibleMD: setVisibleMD
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

  .directive('mainHeader', function($rootScope, screenSize, headerService, dynamicDirectiveService, Fullscreen, SUB_HEADER_HAS_INJECTION_EVENT, SUB_HEADER_VISIBLE_MD_EVENT) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/header/header.html',
      link: function(scope, element) {
        // We need this second variable because screenSize.on is called to many times,
        // for instance when top or bottom bars of mobiles finish moving.
        scope.disableByEvent = false;

        scope.$on('header:hide', function() {
          element.addClass('hidden');
        });

        scope.$on('header:show', function() {
          element.removeClass('hidden');
        });

        scope.$on('header:disable-scroll-listener', function(event, disabled) {
          scope.disableByEvent = disabled;
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

        scope.enableScrollListener = screenSize.on('xs,sm', function(isMatching) {
          scope.enableScrollListener = isMatching;
        }, scope);

        scope.hasSubHeaderGotInjections = headerService.subHeader.hasInjections();

        scope.$on(SUB_HEADER_HAS_INJECTION_EVENT, function(event, hasInjections) {
          scope.hasSubHeaderGotInjections = hasInjections;
        });

        scope.$on(SUB_HEADER_VISIBLE_MD_EVENT, function(event, visibleMd) {
          scope.subHeaderVisibleMd = visibleMd;
        });

        scope.$on('$stateChangeSuccess', function() {
          scope.subHeaderVisibleMd = false;
        });
      }
    };
  });
