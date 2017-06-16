'use strict';

angular.module('esn.box-overlay', [
  'esn.constants',
  'esn.back-detector',
  'ng.deviceDetector',
  'esn.i18n'
])

  .constant('ESN_BOX_OVERLAY_EVENTS', {
    RESIZED: 'esn:box-overlay:resized'
  })

  .service('boxOverlayOpener', function($boxOverlay) {

    function open(options) {
      var overlay = $boxOverlay(options);

      if (angular.isDefined(overlay)) {
        overlay.show();
      }
    }

    return {
      open: open
    };
  })

  .service('boxOverlayService', function($rootScope, notificationFactory, MAX_BOX_COUNT) {

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

    function isBoxAlreadyOpened(scope) {
      return scope.id && boxScopes.some(function(element) { return element.id === scope.id; });
    }

    return {
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: function(scope) {
        if (isBoxAlreadyOpened(scope)) {
          return false;
        }

        if (!spaceLeftOnScreen()) {
          notificationFactory.weakError('', 'Cannot open more than ' + MAX_BOX_COUNT + ' windows. Please close one and try again');

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
      this.callbacks = [];
    }

    StateManager.STATES = {
      NORMAL: 'NORMAL',
      MINIMIZED: 'MINIMIZED',
      MAXIMIZED: 'MAXIMIZED'
    };

    StateManager.prototype.toggle = function(newState) {
      this.state = this.state === newState ? StateManager.STATES.NORMAL : newState;
      this.callbacks.forEach(function(callback) {callback();});
    };

    StateManager.prototype.registerHandler = function(callback) {
      callback && typeof callback === 'function' && this.callbacks.push(callback);
    };

    return StateManager;
  })

  .provider('$boxOverlay', function() {
    this.$get = function($window, $rootScope, $compile, $templateCache, $http, $timeout, boxOverlayService, StateManager, deviceDetector, DEVICES, ESN_BOX_OVERLAY_EVENTS) {
      var boxTemplateUrl = '/views/modules/box-overlay/template.html';

      function container() {
        return angular.element('body .box-overlay-container');
      }

      function ensureContainerElementExists() {
        if (container().length === 0) {
          angular.element($window.document.body).append($compile('<box-overlay-container></box-overlay-container>')($rootScope.$new()));
        }
      }

      function setAutoMaximizeForIPAD(box, scope) {
        if (deviceDetector.device !== DEVICES.I_PAD) {
          return;
        }

        scope.$toggleMaximized();

        box
          .on('focus', 'input, tags-input', function() {
            $window.scrollTo(0, 0); // Avoid shake effect
          })
          .on('touchstart', 'input, textarea, tags-input', function() {
            if (!scope.isMaximized()) {
              scope.$apply(scope.$toggleMaximized);
            }
          });
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

        function initialize() {
          stateManager.registerHandler(notifyComponentsAboutResizeRequest);
        }

        function notifyComponentsAboutResizeRequest() {
          if (!scope.isMinimized()) {
            $rootScope.$broadcast(ESN_BOX_OVERLAY_EVENTS.RESIZED);
          }
        }

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

        scope.$updateTitle = function(title) {
          $boxOverlay.updateTitle(title);
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
            setAutoMaximizeForIPAD(boxElement, scope);

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

        $boxOverlay.updateTitle = function(title) {
          scope.title = title || config.title;
        };

        initialize();
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

  .directive('boxOverlay', function(boxOverlayOpener) {

    return {
      restrict: 'A',
      scope: {
        boxId: '@',
        boxTitle: '@',
        boxTemplateUrl: '@'
      },
      link: function(scope, element) {

        element.on('click', function() {
          boxOverlayOpener.open({
            id: scope.boxId,
            title: scope.boxTitle,
            templateUrl: scope.boxTemplateUrl
          });
        });
      }
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
