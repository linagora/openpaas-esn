'use strict';

angular.module('esn.header', ['esn.sidebar', 'esn.subheader', 'matchmedia-ng', 'esn.media.query'])

  .constant('MAIN_HEADER', 'main-header-middle-content')

  .constant('SUB_HEADER', 'sub-header-content')

  .constant('SUB_HEADER_HAS_INJECTION_EVENT', 'sub-header:hasInjection')

  .constant('SUB_HEADER_VISIBLE_MD_EVENT', 'sub-header:visibleMd')

  .constant('HEADER_VISIBILITY_EVENT', 'header:visible')

  .constant('HEADER_DISABLE_SCROLL_LISTENER_EVENT', 'header:disable-scroll-listener')

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

  .directive('mainHeader', function($rootScope, matchmedia, headerService, Fullscreen,
                                    SUB_HEADER_HAS_INJECTION_EVENT, SUB_HEADER_VISIBLE_MD_EVENT,
                                    HEADER_VISIBILITY_EVENT, HEADER_DISABLE_SCROLL_LISTENER_EVENT, SM_XS_MEDIA_QUERY) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/header/header.html',
      link: function(scope, element) {
        function toggleHeaderVisibility(visible) {
          $rootScope.$broadcast(HEADER_VISIBILITY_EVENT, visible);
        }

        function toggleClass(visible) {
          element.find('#header').toggleClass('hide-top', !visible);
        }

        // We need this second variable because matchmedia.on is called too many times,
        // for instance when top or bottom bars of mobiles finish moving.
        scope.disableByEvent = false;

        scope.$on(HEADER_VISIBILITY_EVENT, function(event, visible) {
          toggleClass(visible);
        });

        scope.$on(HEADER_DISABLE_SCROLL_LISTENER_EVENT, function(event, disabled) {
          scope.disableByEvent = disabled;
        });

        scope.toggleFullScreen = function() {
          Fullscreen.toggleAll();
        };

        scope.hide = toggleHeaderVisibility.bind(null, false);
        scope.show = toggleHeaderVisibility.bind(null, true);

        var unregister = matchmedia.on(SM_XS_MEDIA_QUERY, function(mediaQueryList) {
          scope.enableScrollListener = mediaQueryList.matches;
        }, scope);
        scope.$on('$destroy', unregister);

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
  })

  .directive('headerAware', function(HEADER_VISIBILITY_EVENT) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        scope.$on(HEADER_VISIBILITY_EVENT, function(event, visible) {
          element.toggleClass('header-hidden', !visible);
        });
      }
    };
  });
