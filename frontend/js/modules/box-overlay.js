'use strict';

angular.module('esn.box-overlay', [])
  .provider('$boxOverlay', function() {
    this.$get = function($window, $rootScope, $compile, $templateCache, $http) {
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

        scope.minimized = false;
        $boxOverlay.$isShown = scope.$isShown = false;

        scope.$toggleMinimized = function() {
          scope.minimized = !scope.minimized;
        };

        scope.$hide = function() {
          scope.$$postDigest(function() {
            $boxOverlay.hide();
          });
        };

        scope.$close = function() {
          scope.$$postDigest(function() {
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
          });
        };

        $boxOverlay.hide = function() {
          if (!$boxOverlay.$isShown) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = false;

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

        overlay.show();
        if (scope.boxAutoDestroy) {
          scope.$on('$destroy', function() {
            if (overlay) {
              overlay.destroy();
            }
            overlay = null;
          });
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
