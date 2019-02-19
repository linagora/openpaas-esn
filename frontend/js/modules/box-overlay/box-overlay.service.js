(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').service('boxOverlayService', boxOverlayService);

  function boxOverlayService(_, $rootScope, $window, $compile, notificationFactory, ESN_BOX_OVERLAY_MAX_WINDOWS) {
    var boxScopes = [];

    return {
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: addBox,
      removeBox: removeBox,
      maximizedBoxExists: maximizedBoxExists,
      minimizeOthers: minimizeOthers,
      minimizeAround: minimizeAround,
      hideAround: hideAround,
      overflows: overflows,
      showAll: showAll,
      onShow: onShow,
      onHide: onHide,
      getContainer: getContainer,
      ensureContainerExists: ensureContainerExists,
      removeContainerIfPossible: removeContainerIfPossible
    };

    function overflows() {
      return getWidth() > getContainer()[0].offsetWidth;
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
      return boxScopes
        .filter(function(element) { return element.scope !== me; })
        .forEach(function(element) { element.scope.$minimize(); });
    }

    function hideAround(scope) {
      if (count() === 1) {
        return;
      }

      var index = _findBoxIndex(scope);
      console.log('BOXINDEX', index);
      console.log('BOX', boxScopes[index]);

      if (index < 0) {
        return;
      }

      // TODO: First, try to hide the ones which are minimized...
      // Then if it does not fit, hide maximized ones...
      if (index === 0) {
        // FIXME: hide only if current elemetn does not fit
        setDisplay(1, 'none');
      } else {
        setDisplay(index - 1, 'none');
      }
    }

    function setDisplay(index, display) {
      boxScopes[index].box.$element[0].style.display = display;
    }

    function showAll() {
      boxScopes.forEach(function(element) {
        element.box.$element[0].style.display = '';
      });
    }

    function getWidth() {
      return boxScopes.map(function(bs) {
        return bs.box.$element[0].offsetWidth;
      }).reduce(function(accumulator, width) {
        return accumulator + width;
      });
    }

    function minimizeAround(scope) {
      if (!boxScopes.length || boxScopes.length === 1) {
        return;
      }

      if (scope === boxScopes[0].scope) {
        boxScopes[1].scope.$minimize();
      }

      if (scope === boxScopes[boxScopes.length - 1].scope) {
        boxScopes[boxScopes.length - 1].scope.$minimize();
      }
    }

    function onShow(scope) {
      // if it does not fit in, be radical and minimize all others
      if (getWidth() > getContainer()[0].offsetWidth) {
        // TODO: Minimize from last until there is enough place
        minimizeOthers(scope);
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

    function _findBoxIndex(scope) {
      return _.findIndex(boxScopes, {scope: scope});
    }
  }

})(angular);
