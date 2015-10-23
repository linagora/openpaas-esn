'use strict';

angular.module('esn.box-overlay', ['esn.back-detector'])

  .constant('MAX_BOX_COUNT', 2)
  .service('boxOverlayService', function($rootScope, MAX_BOX_COUNT) {

    var boxCount = 0;

    function spaceLeftOnScreen() {
      return boxCount < MAX_BOX_COUNT;
    }

    function onlyOneSpaceLeftOnScreen() {
      return boxCount === (MAX_BOX_COUNT - 1);
    }

    return {
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: function() {
        if (!spaceLeftOnScreen()) {
          return false;
        }

        boxCount++;
        if (!spaceLeftOnScreen()) {
          $rootScope.$broadcast('box-overlay:no-space-left-on-screen');
        }
        return true;
      },
      removeBox: function() {
        if (boxCount > 0) {
          boxCount--;
          if (onlyOneSpaceLeftOnScreen()) {
            $rootScope.$broadcast('box-overlay:space-left-on-screen');
          }
        }
      }
    };
  })

  .provider('$boxOverlay', function() {
    this.$get = function($window, $rootScope, $compile, $templateCache, $http, $timeout, boxOverlayService) {
      var boxTemplateUrl = '/views/modules/box-overlay/template.html';

      function container() {
        return angular.element('body .box-overlay-container');
      }

      function ensureContainerElementExists() {
        if (container().length === 0) {
          angular.element($window.document.body).append('<div class="box-overlay-container"></div>');
        }
      }

      function removeContainerElementIfPossible() {
        var element = container();

        if (element.children().length === 0) {
          element.remove();
        }
      }

      function BoxOverlayFactory(config) {
        var boxElement,
            scope = angular.extend($rootScope.$new(), config),
            $boxOverlay = { $scope: scope };

        if (!boxOverlayService.addBox()) {
          return;
        }

        scope.minimized = false;
        $boxOverlay.$isShown = scope.$isShown = false;

        scope.$toggleMinimized = function() {
          scope.minimized = !scope.minimized;
        };

        scope.$hide = function() {
          $timeout(function() {
            $boxOverlay.hide();
          });
        };

        scope.$close = function() {
          $timeout(function() {
            $boxOverlay.destroy();
          });
        };

        $boxOverlay.show = function() {
          if ($boxOverlay.$isShown) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = true;

          ensureContainerElementExists();
          fetchTemplate(boxTemplateUrl).then(function(template) {
            boxElement = $boxOverlay.$element = $compile(template)(scope);

            boxElement.addClass('box-overlay-open');
            container().append(boxElement);

            $timeout(function() {
              var toFocus = boxElement.find('[autofocus]')[0];
              if (toFocus) {
                toFocus.focus();
              }
            });

          });
        };

        $boxOverlay.hide = function() {
          if (!$boxOverlay.$isShown) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = false;
          boxOverlayService.removeBox();

          if (boxElement) {
            boxElement.remove();
            boxElement = null;
          }

          removeContainerElementIfPossible();
        };

        $boxOverlay.destroy = function() {
          $boxOverlay.hide();
          scope.$destroy();
        };

        return $boxOverlay;
      }

      function fetchTemplate(template) {
        return $http.get(template, {cache: $templateCache}).then(function(res) {
          return res.data;
        });
      }

      return BoxOverlayFactory;
    };
  })
  .directive('boxOverlay', function($boxOverlay) {
    function buildOptions(scope) {
      return {
        title: scope.boxTitle,
        templateUrl: scope.boxTemplateUrl
      };
    }

    function postLink(scope, element) {
      element.on('click', function() {
        var overlay = $boxOverlay(buildOptions(scope));

        if (angular.isUndefined(overlay)) {
          return;
        }

        overlay.show();
        if (scope.boxAutoDestroy) {
          scope.cleanup = function() {
            if (overlay) {
              overlay.destroy();
            }

            overlay = null;
          };

          //catchBackButton.listenOnce().then(scope.cleanup);
          scope.$on('$destroy', scope.cleanup);
        }
      });
    }

    return {
      restrict: 'A',
      scope: {
        boxAutoDestroy: '=',
        boxTitle: '@',
        boxTemplateUrl: '@'
      },
      link: postLink
    };
  });
