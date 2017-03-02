'use strict';

angular.module('esn.previous-page', [])

  .directive('esnBackButton', function(esnPreviousPage) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        element.click(function() {
          esnPreviousPage.back(attrs.esnBackButton);
        });
      }
    };
  })

  .factory('esnPreviousPage', function($state, $window) {

    function back(defaultState) {
      if ($window.history && $window.history.length > 0) {
        return $window.history.back();
      }

      $state.go(defaultState);
    }

    return {
      back: back
    };
  });
