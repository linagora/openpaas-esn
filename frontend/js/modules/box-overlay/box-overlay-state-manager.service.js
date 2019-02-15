(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').factory('StateManager', StateManager);

  function StateManager() {
    function StateManager() {
      this.state = StateManager.STATES.NORMAL;
      this.callbacks = [];
    }

    StateManager.STATES = {
      NORMAL: 'NORMAL',
      MINIMIZED: 'MINIMIZED',
      MAXIMIZED: 'MAXIMIZED',
      FULL_SCREEN: 'FULL_SCREEN'
    };

    StateManager.prototype.toggle = function(newState) {
      this.state = this.state === newState ? StateManager.STATES.NORMAL : newState;
      this.callbacks.forEach(function(callback) {callback();});
    };

    StateManager.prototype.registerHandler = function(callback) {
      callback && typeof callback === 'function' && this.callbacks.push(callback);
    };

    return StateManager;
  }
})(angular);
