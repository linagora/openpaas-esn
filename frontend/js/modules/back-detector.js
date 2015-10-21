'use strict';

angular.module('esn.back-detector', [])

  .constant('BACK_BTN_EVENT', 'backButtonPressed')

  .directive('onBack', function($rootScope, BACK_BTN_EVENT) {
    return {
      restrict: 'A',
      scope: {
        onBack: '&'
      },
      link: function(scope) {

        scope.$on(BACK_BTN_EVENT, function(event, data) {
          data.locationChangeEvent.preventDefault();
          scope.onBack.apply();
        });

      }
    };
  })

  .run(function($rootScope, BACK_BTN_EVENT) {
    var previousLocation;

    $rootScope.$on('$locationChangeStart', function(event, next) {
      if (next === previousLocation) {
        $rootScope.$broadcast(BACK_BTN_EVENT, {
          locationChangeEvent: event
        });
      }
    });

    $rootScope.$on('$locationChangeSuccess', function(event, current, previous) {
      previousLocation = previous;
    });
  });
