(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').factory('BoxOverlayStateManager', BoxOverlayStateManager);

  function BoxOverlayStateManager() {
    function BoxOverlayStateManager() {
      this.state = BoxOverlayStateManager.STATES.NORMAL;
      this.callbacks = [];
    }

    BoxOverlayStateManager.STATES = {
      NORMAL: 'NORMAL',
      MINIMIZED: 'MINIMIZED',
      MAXIMIZED: 'MAXIMIZED',
      FULL_SCREEN: 'FULL_SCREEN'
    };

    BoxOverlayStateManager.prototype.toggle = function(newState) {
      var oldState = this.state;

      this.state = this.state === newState ? BoxOverlayStateManager.STATES.NORMAL : newState;
      this.callbacks.forEach(function(callback) {callback();});

      return oldState;
    };

    BoxOverlayStateManager.prototype.registerHandler = function(callback) {
      callback && typeof callback === 'function' && this.callbacks.push(callback);
    };

    return BoxOverlayStateManager;
  }
})(angular);
