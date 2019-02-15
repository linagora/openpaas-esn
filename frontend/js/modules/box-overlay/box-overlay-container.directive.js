(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').directive('boxOverlayContainer', boxOverlayContainer);

  function boxOverlayContainer(boxOverlayService) {
    return {
      restrict: 'AE',
      replace: true,
      template: '<div class="box-overlay-container" ng-class="{ \'maximized\': isMaximized() }"></div>',
      link: function($scope) {
        $scope.isMaximized = boxOverlayService.maximizedBoxExists;
      }
    };
  }
})(angular);
