'use strict';

angular.module('esn.previous-page', [])

  .run(function(esnPreviousPage) {
    esnPreviousPage.init();
  })

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

  .factory('esnPreviousPage', function($rootScope, $state, $window) {
    var hasPreviousPage = false;

    return {
      back: back,
      init: init
    };

    function back(defaultState) {
      if (hasPreviousPage && $window.history && $window.history.length > 0) {
        return $window.history.back();
      }

      $state.go(defaultState);
    }

    function init() {
      var unregister = $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
        // if url updated and new history record added
        // see more at https://github.com/angular-ui/ui-router/wiki/quick-reference#stategoto--toparams--options
        if (options && options.location === true) {
          hasPreviousPage = true;
          unregister();
        }
      });
    }
  });
