(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').provider('$boxOverlay', boxOverlayProvider);

  function boxOverlayProvider() {
    this.$get = function($window, $rootScope, $timeout, $q, boxOverlayManager, BoxOverlayStateManager, deviceDetector, DEVICES, ESN_BOX_OVERLAY_EVENTS) {
      return BoxOverlayFactory;

      function BoxOverlayFactory(config) {
        var scope = angular.extend($rootScope.$new(), config);
        var $boxOverlay = { $scope: scope };
        var stateManager = new BoxOverlayStateManager();

        $boxOverlay.$isShown = scope.$isShown = false;

        scope.allowMinimize = _allow.bind(null, BoxOverlayStateManager.STATES.MINIMIZED);
        scope.allowMaximize = _allow.bind(null, BoxOverlayStateManager.STATES.MAXIMIZED);
        scope.allowFullScreen = _allow.bind(null, BoxOverlayStateManager.STATES.FULL_SCREEN);
        scope.isMinimized = _is.bind(null, BoxOverlayStateManager.STATES.MINIMIZED);
        scope.isNormal = _is.bind(null, BoxOverlayStateManager.STATES.NORMAL);
        scope.isMaximized = _is.bind(null, BoxOverlayStateManager.STATES.MAXIMIZED);
        scope.isFullScreen = _is.bind(null, BoxOverlayStateManager.STATES.FULL_SCREEN);
        scope.$toggleMinimized = _toggle.bind(null, BoxOverlayStateManager.STATES.MINIMIZED);
        scope.$toggleMaximized = _toggle.bind(null, BoxOverlayStateManager.STATES.MAXIMIZED);
        scope.$toggleFullScreen = _toggle.bind(null, BoxOverlayStateManager.STATES.FULL_SCREEN);
        scope.$forceClose = nextTick('destroy');
        scope.$show = nextTick('show');
        scope.$hide = nextTick('hide');
        scope.$updateTitle = updateTitle;
        scope.$setId = setId;
        scope.$minimize = minimize;
        scope.$onTryClose = onTryClose;
        scope.$close = close;

        $boxOverlay.onTryClose = $q.when;
        $boxOverlay.show = show;
        $boxOverlay.hide = hide;
        $boxOverlay.destroy = destroy;
        $boxOverlay.updateTitle = updateBoxTitle;

        function minimize() {
          stateManager.state = BoxOverlayStateManager.STATES.MINIMIZED;
          addClass('minimized');
          removeClass('maximized');
        }

        function onTryClose(callback) {
          $boxOverlay.onTryClose = angular.isFunction(callback) ? callback : $boxOverlay.onTryClose;
        }

        function close() {
          $boxOverlay.hide();

          return $boxOverlay.onTryClose().then(scope.$forceClose);
        }

        function _allow(state) {
          return !config.allowedStates || config.allowedStates.indexOf(state) > -1;
        }

        scope.closeable = function() {
          return !angular.isDefined(config.closeable) || config.closeable;
        };

        function _is(state) {
          return stateManager.state === state;
        }

        function _toggle(state) {
          boxOverlayManager.showAll();
          var previous = stateManager.toggle(state);

          if (state === BoxOverlayStateManager.STATES.MINIMIZED) {
            if (previous === BoxOverlayStateManager.STATES.MAXIMIZED) {
              boxOverlayManager.minimizeOthers($boxOverlay);
            } else {
              toggleClass('minimized');
              boxOverlayManager.reorganize($boxOverlay);
            }
          }

          if (state === BoxOverlayStateManager.STATES.MAXIMIZED) {
            if (previous === BoxOverlayStateManager.STATES.MAXIMIZED) {
              addClass('minimized');
            } else {
              removeClass('minimized');
              boxOverlayManager.minimizeOthers($boxOverlay);
            }
          }
        }

        function nextTick(action) {
          return function() {
            $timeout(function() {
              $boxOverlay[action]();
            }, 0);
          };
        }

        function updateTitle(title) {
          $boxOverlay.updateTitle(title);
        }

        function setId(id) {
          scope.id = id;
        }

        function show() {
          if ($boxOverlay.$isShown || !boxOverlayManager.addBox($boxOverlay)) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = true;
          boxOverlayManager.createElement(scope).then(function(element) {
            $boxOverlay.$element = element;
            boxOverlayManager.onShow($boxOverlay);

            setAutoMaximizeForIPAD($boxOverlay.$element, scope);

            if (config.initialState) {
              _toggle(config.initialState);
            }

            $timeout(function() {
              var toFocus = $boxOverlay.$element.find('[autofocus]')[0];

              if (toFocus) {
                toFocus.focus();
              }
            });

          });
        }

        function hide() {
          if (!$boxOverlay.$isShown) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = false;
          boxOverlayManager.removeBox($boxOverlay);

          if ($boxOverlay.$element) {
            $boxOverlay.$element.remove();
            $boxOverlay.$element = null;
          }

          boxOverlayManager.onHide();
        }

        function destroy() {
          $boxOverlay.hide();
          scope.$destroy();
        }

        function updateBoxTitle(title) {
          scope.title = title || config.title;
        }

        function initialize() {
          stateManager.registerHandler(notifyComponentsAboutResizeRequest);
        }

        function notifyComponentsAboutResizeRequest() {
          if (!scope.isMinimized()) {
            $rootScope.$broadcast(ESN_BOX_OVERLAY_EVENTS.RESIZED);
          }
        }

        function addClass(name) {
          $boxOverlay.$element && $boxOverlay.$element[0] && $boxOverlay.$element[0].classList.add(name);
        }

        function removeClass(name) {
          $boxOverlay.$element && $boxOverlay.$element[0] && $boxOverlay.$element[0].classList.remove(name);
        }

        function toggleClass(name) {
          $boxOverlay.$element && $boxOverlay.$element[0] && $boxOverlay.$element[0].classList.toggle(name);
        }

        initialize();

        return $boxOverlay;
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
    };
  }
})(angular);
