'use strict';

angular.module('esn.subheader', ['esn.media.query'])

  .constant('SUBHEADER_VISIBLE_EVENT', 'subHeaderVisible')

  .constant('SUBHEADER_AWARE_CLASS', 'subheader-aware')

  .factory('subHeaderService', function($rootScope, SUBHEADER_VISIBLE_EVENT) {
    var subHeaderQueue = [];
    var injectSubHeader;
    var destroySubHeader;
    var visible = false;

    function registerContainer(injectHandler, destroyHandler) {
      injectSubHeader = injectHandler;
      destroySubHeader = destroyHandler;

      if (subHeaderQueue.length > 0) {
        subHeaderQueue.forEach(function(item) {
          injectHandler(item.content);
        });
        subHeaderQueue = [];
      }
    }

    function unregisterContainer() {
      subHeaderQueue = [];
      injectSubHeader = destroySubHeader = null;
      setVisible(false);
    }

    function inject(content) {
      if (injectSubHeader) {
        injectSubHeader(content);
      } else {
        subHeaderQueue.push({
          content: content
        });
      }
    }

    function destroy() {
      if (destroySubHeader) {
        destroySubHeader();
      }
    }

    function setVisible(_visible) {
      if (_visible !== visible) {
        visible = _visible;
        $rootScope.$broadcast(SUBHEADER_VISIBLE_EVENT, visible);
      }
    }

    function isVisible() {
      return visible;
    }

    return {
      registerContainer: registerContainer,
      unregisterContainer: unregisterContainer,
      inject: inject,
      destroy: destroy,
      setVisible: setVisible,
      isVisible: isVisible
    };
  })

  .directive('subHeader', function(subHeaderService) {
    return {
      // only be used as element to avoid conflict with other directives on transclude
      restrict: 'E',
      transclude: true,
      link: function(scope, element, attrs, ctrl, transclude) {
        transclude(function(transcludedContent, transcludedScope) {
          subHeaderService.inject(transcludedContent);

          scope.$on('$destroy', function() {
            transcludedContent.remove();
            transcludedScope.$destroy();
            subHeaderService.destroy();
          });
        });
      }
    };
  })

  .directive('subHeaderContainer', function(subHeaderService, matchmedia, SM_XS_MEDIA_QUERY) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/subheader/sub-header-container.html',
      link: function(scope, element) {
        var container = element.find('#sub-header');

        subHeaderService.registerContainer(injectHandler, destroyHandler);
        ensureVisible();

        var unregister = matchmedia.on(SM_XS_MEDIA_QUERY, function() {
          ensureVisible();
        }, scope);

        scope.$on('$destroy', function() {
          unregister();
          subHeaderService.unregisterContainer();
        });

        function hasVisibleElement() {
          return container.children(':visible').length;
        }

        function ensureVisible() {
          container.show();

          if (hasVisibleElement()) {
            subHeaderService.setVisible(true);
          } else {
            container.hide();
            subHeaderService.setVisible(false);
          }
        }

        function injectHandler(content) {
          container.append(content);
          ensureVisible();
        }

        function destroyHandler() {
          ensureVisible();
        }
      }
    };
  })

  .directive('subHeaderAware', function(subHeaderService, SUBHEADER_AWARE_CLASS, SUBHEADER_VISIBLE_EVENT) {
    function link(scope, element) {
      if (subHeaderService.isVisible()) {
        element.addClass(SUBHEADER_AWARE_CLASS);
      }

      scope.$on(SUBHEADER_VISIBLE_EVENT, function(event, visible) {
        element.toggleClass(SUBHEADER_AWARE_CLASS, visible);
      });
    }

    return {
      restrict: 'A',
      link: link
    };
  });
