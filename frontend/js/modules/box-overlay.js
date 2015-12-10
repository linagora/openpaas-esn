'use strict';

angular.module('esn.box-overlay', ['esn.back-detector'])

  .constant('MAX_BOX_COUNT', 2)

  .service('boxOverlayService', function($rootScope, MAX_BOX_COUNT) {

    var boxScopes = [];

    function count() {
      return boxScopes.length;
    }

    function spaceLeftOnScreen() {
      return count() < MAX_BOX_COUNT;
    }

    function onlyOneSpaceLeftOnScreen() {
      return count() === (MAX_BOX_COUNT - 1);
    }

    return {
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: function(scope) {
        if (!spaceLeftOnScreen()) {
          return false;
        }

        boxScopes.push(scope);

        if (!spaceLeftOnScreen()) {
          $rootScope.$broadcast('box-overlay:no-space-left-on-screen');
        }

        return true;
      },
      removeBox: function(scope) {
        if (count() > 0) {
          var index = boxScopes.indexOf(scope);

          if (index > -1) {
            boxScopes.splice(index, 1);

            if (onlyOneSpaceLeftOnScreen()) {
              $rootScope.$broadcast('box-overlay:space-left-on-screen');
            }
          }
        }
      },
      maximizedBoxExists: function() {
        return boxScopes.some(function(scope) { return scope.isMaximized(); });
      },
      minimizeOthers: function(me) {
        return boxScopes
          .filter(function(scope) { return scope !== me; })
          .forEach(function(scope) { scope.$minimize(); });
      }
    };
  })

  .factory('StateManager', function() {
    function StateManager() {
      this.state = StateManager.STATES.NORMAL;
    }

    StateManager.STATES = {
      NORMAL: 'NORMAL',
      MINIMIZED: 'MINIMIZED',
      MAXIMIZED: 'MAXIMIZED'
    };

    StateManager.prototype.toggle = function(newState) {
      this.state = this.state === newState ? StateManager.STATES.NORMAL : newState;
    };

    return StateManager;
  })

  .provider('$boxOverlay', function() {
    this.$get = function($window, $rootScope, $compile, $templateCache, $http, $timeout, boxOverlayService, StateManager) {
      var boxTemplateUrl = '/views/modules/box-overlay/template.html';

      function container() {
        return angular.element('body .box-overlay-container');
      }

      function ensureContainerElementExists() {
        if (container().length === 0) {
          angular.element($window.document.body).append($compile('<box-overlay-container></box-overlay-container>')($rootScope.$new()));
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
            $boxOverlay = { $scope: scope},
            stateManager = new StateManager();

        if (!boxOverlayService.addBox(scope)) {
          return;
        }

        $boxOverlay.$isShown = scope.$isShown = false;

        scope.isMinimized = function() {
          return stateManager.state === StateManager.STATES.MINIMIZED;
        };

        scope.isMaximized = function() {
          return stateManager.state === StateManager.STATES.MAXIMIZED;
        };

        scope.$toggleMinimized = function() {
          stateManager.toggle(StateManager.STATES.MINIMIZED);
        };

        scope.$minimize = function() {
          stateManager.state = StateManager.STATES.MINIMIZED;
        };

        scope.$toggleMaximized = function() {
          stateManager.toggle(StateManager.STATES.MAXIMIZED);

          if (scope.isMaximized()) {
            boxOverlayService.minimizeOthers(scope);
          }
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
          boxOverlayService.removeBox(scope);

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
      });
    }

    return {
      restrict: 'A',
      scope: {
        boxTitle: '@',
        boxTemplateUrl: '@'
      },
      link: postLink
    };
  })

  .directive('boxOverlayContainer', function(boxOverlayService) {
    return {
      restrict: 'AE',
      replace: true,
      template: '<div class="box-overlay-container" ng-class="{ \'maximized\': isMaximized() }"></div>',
      link: function($scope) {
        $scope.isMaximized = boxOverlayService.maximizedBoxExists;
      }
    };
  });
