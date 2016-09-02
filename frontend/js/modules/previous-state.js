'use strict';

angular.module('esn.previous-state', ['ct.ui.router.extras'])
  .factory('esnPreviousState', function($state, $previousState) {
    var previousState;

    function get() {
      return previousState;
    }

    function set() {
      previousState = $previousState.get();
    }

    function go(defaultState) {
      if (previousState) {
        return $state.go(previousState.state.name, previousState.params || {});
      }

      if (history && history.length > 0) {
        return history.back();
      }

      return $state.go(defaultState);
    }

    return {
      get: get,
      set: set,
      go: go
    };
  })
  .directive('esnBackButton', function(esnPreviousState) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.click(function() {
          esnPreviousState.go(attrs.esnBackButton);
        });
      }
    };
  });
