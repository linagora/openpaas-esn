(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').service('boxOverlayManager', boxOverlayManager);

  function boxOverlayManager(_, $rootScope, $window, $compile, $http, $templateCache, notificationFactory, ESN_BOX_OVERLAY_MAX_WINDOWS) {
    var boxTemplateUrl = '/views/modules/box-overlay/box-overlay.html';
    var boxScopes = [];

    return {
      createElement: createElement,
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: addBox,
      removeBox: removeBox,
      maximizedBoxExists: maximizedBoxExists,
      minimizeOthers: minimizeOthers,
      reorganize: reorganize,
      overflows: overflows,
      showAll: showAll,
      onShow: onShow,
      onHide: onHide,
      getContainer: getContainer,
      ensureContainerExists: ensureContainerExists,
      removeContainerIfPossible: removeContainerIfPossible
    };

    function overflows() {
      return getWidth() > getContainerWidth();
    }

    function getContainerWidth() {
      return getContainer()[0].offsetWidth;
    }

    function count() {
      return boxScopes.length;
    }

    function spaceLeftOnScreen() {
      return count() < ESN_BOX_OVERLAY_MAX_WINDOWS;
    }

    function onlyOneSpaceLeftOnScreen() {
      return count() === (ESN_BOX_OVERLAY_MAX_WINDOWS - 1);
    }

    function isBoxAlreadyOpened(scope) {
      return scope.id && boxScopes.some(function(element) { return element.scope.id === scope.id; });
    }

    function addBox(scope, box) {
      if (isBoxAlreadyOpened(scope)) {
        return false;
      }

      if (!spaceLeftOnScreen()) {
        notificationFactory.weakError('', 'Cannot open more than ' + ESN_BOX_OVERLAY_MAX_WINDOWS + ' windows. Please close one and try again');

        return false;
      }

      boxScopes.push({scope: scope, box: box});

      if (!spaceLeftOnScreen()) {
        $rootScope.$broadcast('box-overlay:no-space-left-on-screen');
      }

      return true;
    }

    function removeBox(scope) {
      if (count() > 0) {
        var index = _findBoxIndex(scope);

        if (index > -1) {
          boxScopes.splice(index, 1);

          if (onlyOneSpaceLeftOnScreen()) {
            $rootScope.$broadcast('box-overlay:space-left-on-screen');
          }
        }
      }
    }

    function maximizedBoxExists() {
      return boxScopes.some(function(element) { return element.scope.isMaximized() || element.scope.isFullScreen(); });
    }

    function minimizeOthers(me) {
      showAll();

      return boxScopes
        .filter(function(element) { return element.scope !== me; })
        .forEach(function(element) { element.scope.$minimize(); });
    }

    function hideOthers(me) {
    }

    function reorganize(scope) {
      if (count() === 1) {
        return;
      }

      if (!overflows()) {
        return;
      }

      var index = _findBoxIndex(scope);

      if (index < 0) {
        return;
      }

      hideMinimizedRightUntilFits(index + 1);
      hideMinimizedLeftUntilFits(index);
      minimizeUntilFits(index);

      if (overflows()) {
        hideOthers(scope);
      }

      // TODO: Show all on window destroy (not here)
    }

    function hideMinimizedRightUntilFits(from) {
      if (from !== count()) {
        while (overflows()) {
          hideIfMinimized(from);

          if (++from >= boxScopes.length) {
            break;
          }
        }
      }
    }

    function hideMinimizedLeftUntilFits(to) {
      var i = 0;

      while (overflows()) {
        if (i !== to) {
          hideIfMinimized(i);
        }

        if (++i >= to) {
          break;
        }
      }
    }

    function minimizeUntilFits(exclude) {
      var i = 0;

      while (overflows()) {
        if (i !== exclude) {
          minimize(i);
        }

        if (++i >= boxScopes.length) {
          break;
        }
      }
    }

    function hideIfMinimized(index) {
      if (boxScopes[index] && boxScopes[index].scope.isMinimized()) {
        setDisplay(index, 'none');
      }
    }

    function minimize(index) {
      boxScopes[index].scope.$minimize();
    }

    function setDisplay(index, display) {
      if (boxScopes[index]) {
        boxScopes[index].box.$element[0].style.display = display;
      }
    }

    function showAll() {
      boxScopes.forEach(function(element) {
        element.box.$element[0].style.display = 'flex';
      });
    }

    function getWidth() {
      return boxScopes.map(function(bs) {
        return bs.box.$element[0].offsetWidth;
      }).reduce(function(accumulator, width) {
        return accumulator + width + 6; // 6 is the margin, not available in offsetWidth and not standard with others methods...
      });
    }

    function onShow(scope) {
      if (overflows()) {
        var index = _findBoxIndex(scope);
        var i = 0;

        if (index < 0) {
          return;
        }

        while (overflows()) {
          if (i < index) {
            minimize(i);
          }

          if (++i === index) {
            break;
          }
        }
      }
    }

    function onHide() {
      removeContainerIfPossible();
    }

    function getContainer() {
      return angular.element('body .box-overlay-container');
    }

    function ensureContainerExists() {
      if (getContainer().length === 0) {
        angular.element($window.document.body).append($compile('<box-overlay-container></box-overlay-container>')($rootScope.$new()));
      }

      return getContainer();
    }

    function removeContainerIfPossible() {
      var element = getContainer();

      if (element.children().length === 0) {
        element.remove();
      }
    }

    function createElement(scope) {
      ensureContainerExists();

      return buildElement(scope).then(function(element) {
        element.addClass('box-overlay-open');
        getContainer().prepend(element);

        return element;
      });
    }

    function buildElement(scope) {
      return _fetchTemplate().then(function(template) {
        return $compile(template)(scope);
      });
    }

    function _fetchTemplate() {
      return $http.get(boxTemplateUrl, {cache: $templateCache}).then(function(res) {
        return res.data;
      });
    }

    function _findBoxIndex(scope) {
      return _.findIndex(boxScopes, {scope: scope});
    }
  }

})(angular);
