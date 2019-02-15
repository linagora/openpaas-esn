(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').service('boxOverlayService', boxOverlayService);

  function boxOverlayService($rootScope, notificationFactory, MAX_BOX_COUNT) {
    var boxScopes = [];

    return {
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: addBox,
      removeBox: removeBox,
      maximizedBoxExists: maximizedBoxExists,
      minimizeOthers: minimizeOthers
    };

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

    function addBox(scope) {
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
    }

    function removeBox(scope) {
      if (count() > 0) {
        var index = boxScopes.indexOf(scope);

        if (index > -1) {
          boxScopes.splice(index, 1);

          if (onlyOneSpaceLeftOnScreen()) {
            $rootScope.$broadcast('box-overlay:space-left-on-screen');
          }
        }
      }
    }

    function maximizedBoxExists() {
      return boxScopes.some(function(scope) { return scope.isMaximized() || scope.isFullScreen(); });
    }

    function minimizeOthers(me) {
      return boxScopes
        .filter(function(scope) { return scope !== me; })
        .forEach(function(scope) { scope.$minimize(); });
    }
  }

})(angular);
