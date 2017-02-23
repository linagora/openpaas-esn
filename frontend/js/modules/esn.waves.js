'use strict';

angular.module('esn.waves', [])

  .run(function($window) {
    $window.Waves.init();
  })

  .directive('btn', function($window) {
    return {
      restrict: 'C',
      link: function(scope, element) {
        if (element.hasClass('btn-icon') || element.hasClass('btn-float')) {
          $window.Waves.attach(element, ['waves-light', 'waves-circle']);
        } else if (element.hasClass('btn-link')) {
          $window.Waves.attach(element, ['waves-light']);
        } else {
          $window.Waves.attach(element);
        }
      }
    };
  });
