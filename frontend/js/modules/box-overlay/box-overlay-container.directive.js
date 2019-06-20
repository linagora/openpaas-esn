(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').directive('boxOverlayContainer', boxOverlayContainer);

  function boxOverlayContainer(boxOverlayManager) {
    return {
      restrict: 'AE',
      replace: true,
      template: '<div class="box-overlay-container" ng-class="{ \'maximized\': isMaximized() }"><div class="box-overlay-hack"></div></div>',
      link: function($scope) {
        $scope.isMaximized = boxOverlayManager.maximizedBoxExists;
      }
    };
  }
})(angular);
