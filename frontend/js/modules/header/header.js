'use strict';

angular.module('esn.header', [
  'ui.router',
  'hl.sticky',
  'esn.sidebar',
  'esn.subheader',
  'matchmedia-ng',
  'esn.media.query',
  'esn.core',
  'esn.profile',
  'esn.search',
  'esn.profile-menu',
  'mgcrea.ngStrap.popover'
  ])

  .constant('MAIN_HEADER', 'main-header-middle-content')

  .constant('SUB_HEADER', 'sub-header-content')

  .constant('SUB_HEADER_HAS_INJECTION_EVENT', 'sub-header:hasInjection')

  .constant('ESN_HEADER_HEIGHT_MD', 56)

  .constant('ESN_HEADER_HEIGHT_XL', 65)

  .constant('ESN_SUBHEADER_HEIGHT_XS', 56)

  .constant('ESN_SUBHEADER_HEIGHT_MD', 47)

  .factory('headerService', function($rootScope, dynamicDirectiveService, MAIN_HEADER, SUB_HEADER, SUB_HEADER_HAS_INJECTION_EVENT) {

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

  .directive('mainHeader', function($rootScope, matchmedia, headerService, Fullscreen,
                                    SUB_HEADER_HAS_INJECTION_EVENT, SM_XS_MEDIA_QUERY) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/header/header.html',
      link: function(scope) {
        // We need this second variable because matchmedia.on is called too many times,
        // for instance when top or bottom bars of mobiles finish moving.
        scope.disableByEvent = false;

        scope.toggleFullScreen = function() {
          Fullscreen.toggleAll();
        };

        var unregister = matchmedia.on(SM_XS_MEDIA_QUERY, function(mediaQueryList) {
          scope.enableScrollListener = mediaQueryList.matches;
        }, scope);
        scope.$on('$destroy', unregister);

        scope.hasSubHeaderGotInjections = headerService.subHeader.hasInjections();

        scope.$on(SUB_HEADER_HAS_INJECTION_EVENT, function(event, hasInjections) {
          scope.hasSubHeaderGotInjections = hasInjections;
        });

        scope.$on('$stateChangeSuccess', function() {
          scope.subHeaderVisibleMd = false;
        });
      }
    };
  });
