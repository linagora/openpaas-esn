(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').provider('$boxOverlay', boxOverlayProvider);

  function boxOverlayProvider() {
    var boxTemplateUrl = '/views/modules/box-overlay/box-overlay.html';

    this.$get = function($window, $rootScope, $compile, $templateCache, $http, $timeout, $q, boxOverlayService, BoxOverlayStateManager, deviceDetector, DEVICES, ESN_BOX_OVERLAY_EVENTS) {
      return BoxOverlayFactory;

      function BoxOverlayFactory(config) {
        var boxElement;
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
          boxOverlayService.showAll();
          // TODO: minimize the overflowed ones
          stateManager.toggle(state);

          if (scope.isMaximized() || scope.isFullScreen()) {
            boxOverlayService.minimizeOthers(scope);
          }

          if (scope.isNormal()) {
            // TODO: We can not rely on waiting for the digest, need to change class by hand instead
            $timeout(function() {
              if (scope.isNormal() && boxOverlayService.overflows()) {
                boxOverlayService.hideAround(scope);
              }
              // if still not enough, hide elements around...
              // TODO
              // TODO: If implemented, be sure to show elements on toggle or on any other situations
            });
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

        function show() {
          if ($boxOverlay.$isShown || !boxOverlayService.addBox(scope, $boxOverlay)) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = true;
          boxOverlayService.ensureContainerExists();

          fetchTemplate(boxTemplateUrl).then(function(template) {
            boxElement = $boxOverlay.$element = $compile(template)(scope);
            boxElement.addClass('box-overlay-open');
            getContainer().prepend(boxElement);

            boxOverlayService.onShow(scope);

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
        }

        function hide() {
          if (!$boxOverlay.$isShown) {
            return;
          }

          $boxOverlay.$isShown = scope.$isShown = false;
          boxOverlayService.removeBox(scope);

          if (boxElement) {
            boxElement.remove();
            boxElement = null;
          }

          boxOverlayService.onHide();
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

        initialize();

        return $boxOverlay;
      }

      function getContainer() {
        return boxOverlayService.getContainer();
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

      function fetchTemplate(template) {
        return $http.get(template, {cache: $templateCache}).then(function(res) {
          return res.data;
        });
      }
    };
  }
})(angular);
