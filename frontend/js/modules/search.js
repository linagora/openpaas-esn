'use strict';

angular.module('esn.search', [])
  .constant('defaultSpinnerConfiguration', {
    spinnerKey: 'spinnerDefault',
    spinnerConf: {lines: 17, length: 15, width: 7, radius: 33, corners: 1, rotate: 0, direction: 1, color: '#555', speed: 1, trail: 60, shadow: false, hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto', left: 'auto'}
  })
  .directive('searchForm', function(defaultSpinnerConfiguration) {
    return {
      restrict: 'E',
      controller: function($scope) {
        $scope.spinnerKey = angular.isDefined($scope.spinnerKey) ? $scope.spinnerKey : defaultSpinnerConfiguration.spinnerKey;
        $scope.spinnerConf = angular.isDefined($scope.spinnerConf) ? $scope.spinnerConf : defaultSpinnerConfiguration.spinnerConf;
      },
      templateUrl: '/views/modules/search/searchForm.html'
    };
  })
  .factory('searchResultSizeFormatter', function() {
    return function(count) {

      if (!count) {
        return 0;
      }

      if (count < 1000) {
        return count;
      }

      var len = Math.ceil(Math.log(count + 1) / Math.LN10);
      return Math.round(count * Math.pow(10, -(len - 3))) * Math.pow(10, len - 3);
    };
  });
