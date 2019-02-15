(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').provider('$boxOverlay', boxOverlayProvider);

  function boxOverlayProvider() {
    this.$get = function($window, $rootScope, $compile, $templateCache, $http, $timeout, $q, boxOverlayService, StateManager, deviceDetector, DEVICES, ESN_BOX_OVERLAY_EVENTS) {
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
            $boxOverlay = { $scope: scope },
            stateManager = new StateManager();

        function initialize() {
          stateManager.registerHandler(notifyComponentsAboutResizeRequest);
        }

        function notifyComponentsAboutResizeRequest() {
          if (!scope.isMinimized()) {
            $rootScope.$broadcast(ESN_BOX_OVERLAY_EVENTS.RESIZED);
          }
        }

        $boxOverlay.$isShown = scope.$isShown = false;

        scope.allowMinimize = _allow.bind(null, StateManager.STATES.MINIMIZED);
        scope.allowMaximize = _allow.bind(null, StateManager.STATES.MAXIMIZED);
        scope.allowFullScreen = _allow.bind(null, StateManager.STATES.FULL_SCREEN);

        function _allow(state) {
          return !config.allowedStates || config.allowedStates.indexOf(state) > -1;
        }

        scope.closeable = function() {
          return !angular.isDefined(config.closeable) || config.closeable;
        };

        scope.isMinimized = _is.bind(null, StateManager.STATES.MINIMIZED);
        scope.isMaximized = _is.bind(null, StateManager.STATES.MAXIMIZED);
        scope.isFullScreen = _is.bind(null, StateManager.STATES.FULL_SCREEN);

        function _is(state) {
          return stateManager.state === state;
        }

        scope.$minimize = function() {
          stateManager.state = StateManager.STATES.MINIMIZED;
        };

        scope.$toggleMinimized = _toggle.bind(null, StateManager.STATES.MINIMIZED);
        scope.$toggleMaximized = _toggle.bind(null, StateManager.STATES.MAXIMIZED);
        scope.$toggleFullScreen = _toggle.bind(null, StateManager.STATES.FULL_SCREEN);

        function _toggle(state) {
          stateManager.toggle(state);

          if (scope.isMaximized() || scope.isFullScreen()) {
            boxOverlayService.minimizeOthers(scope);
          }
        }

        scope.$show = nextTick('show');
        scope.$hide = nextTick('hide');

        $boxOverlay.onTryClose = $q.when;

        scope.$onTryClose = function(callback) {
          $boxOverlay.onTryClose = angular.isFunction(callback) ? callback : $boxOverlay.onTryClose;
        };

        scope.$close = function() {
          $boxOverlay.hide();

          return $boxOverlay.onTryClose().then(scope.$forceClose);
        };

        scope.$forceClose = nextTick('destroy');

        function nextTick(action) {
          return function() {
            $timeout(function() {
              $boxOverlay[action]();
            }, 0);
          };
        }

        scope.$updateTitle = function(title) {
          $boxOverlay.updateTitle(title);
        };

        $boxOverlay.show = function() {
          if ($boxOverlay.$isShown || !boxOverlayService.addBox(scope)) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = true;

          ensureContainerElementExists();
          fetchTemplate(boxTemplateUrl).then(function(template) {
            boxElement = $boxOverlay.$element = $compile(template)(scope);

            boxElement.addClass('box-overlay-open');
            container().append(boxElement);
            setAutoMaximizeForIPAD(boxElement, scope);

            if (config.initialState) {
              _toggle(config.initialState);
            }

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
  }
})(angular);
