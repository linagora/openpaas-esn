'use strict';

angular.module('esn.settings-overlay', [])

  .directive('settingsOverlay', function() {
    return {
      restrict: 'E',
      controller: function($scope, $attrs) {
        $scope.settingsOverlaySref = $attrs.settingsOverlaySref;
      },
      templateUrl: '/views/modules/settings-overlay/template.html'
    };
  });
