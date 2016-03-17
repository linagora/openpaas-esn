'use strict';

angular.module('esn.subheader', [])

  .factory('subHeaderService', function() {
    var subHeaderQueue = [];
    var injectSubHeader;
    var destroySubHeader;
    var visible = false;

    function registerContainer(injectHandler, destroyHandler) {
      injectSubHeader = injectHandler;
      destroySubHeader = destroyHandler;

      if (subHeaderQueue.length > 0) {
        subHeaderQueue.forEach(function(item) {
          injectHandler(item.content, item.options);
        });
        subHeaderQueue = [];
      }
    }

    function unregisterContainer() {
      subHeaderQueue = [];
      injectSubHeader = destroySubHeader = null;
    }

    function inject(content, options) {
      if (injectSubHeader) {
        injectSubHeader(content, options);
      } else {
        subHeaderQueue.push({
          content: content,
          options: options
        });
      }
    }

    function destroy() {
      if (destroySubHeader) {
        destroySubHeader();
      }
    }

    function setVisible(_visible) {
      visible = _visible;
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
      scope: {
        subHeaderVisibleMd: '='
      },
      link: function(scope, element, attrs, ctrl, transclude) {
        transclude(function(transcludedContent, transcludedScope) {
          var options = { visibleMd: scope.subHeaderVisibleMd };
          subHeaderService.inject(transcludedContent, options);
          scope.$on('$destroy', function() {
            transcludedContent.remove();
            transcludedScope.$destroy();
            subHeaderService.destroy();
          });
        });
      }
    };
  })

  .directive('subHeaderContainer', function(subHeaderService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/subheader/sub-header-container.html',
      scope: {
        hideOnEmpty: '='
      },
      link: function(scope, element) {
        var container = element.find('#sub-header');

        function hideOnEmpty() {
          if (scope.hideOnEmpty && container.html().trim().length === 0) {
            container.hide();
            subHeaderService.setVisible(false);
          }
        }

        function injectHandler(content, options) {
          container.append(content);
          container.show();
          subHeaderService.setVisible(true);

          if (options.visibleMd) {
            element.addClass('visible-md');
          }
        }

        function destroyHandler() {
          hideOnEmpty();
        }

        subHeaderService.registerContainer(injectHandler, destroyHandler);

        scope.$on('$stateChangeStart', function() {
          element.removeClass('visible-md');
        });

        scope.$on('$destroy', function() {
          subHeaderService.unregisterContainer();
        });

        subHeaderService.setVisible(true);
        hideOnEmpty();
      }
    };
  });
