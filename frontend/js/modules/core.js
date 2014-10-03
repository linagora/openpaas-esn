'use strict';

angular.module('esn.core', [])
  .controller('selectActiveItem', ['$scope', function($scope) {
    $scope.selected = 1;
    $scope.selectItem = function(index) {
      $scope.selected = index;
    };
  }])
  .filter('bytes', function() {
    return function(bytes, precision) {
      if (bytes === 0) {
        return '0 bytes';
      }

      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
        return '-';
      }

      if (typeof precision === 'undefined') {
        precision = 1;
      }

      var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024)),
        val = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

      return (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) + '' + units[number];
    };
  })
  .filter('inSlicesOf', ['$rootScope', function($rootScope) {
    var makeSlices = function(items, count) {
      if (!count) {
        count = 3;
      }

      if (!angular.isArray(items) && !angular.isString(items)) {
        return items;
      }

      var array = [];
      for (var i = 0; i < items.length; i++) {
        var chunkIndex = parseInt(i / count, 10);
        var isFirst = (i % count === 0);
        if (isFirst) {
          array[chunkIndex] = [];
        }
        array[chunkIndex].push(items[i]);
      }

      if (angular.equals($rootScope.arrayinSliceOf, array)) {
        return $rootScope.arrayinSliceOf;
      } else {
        $rootScope.arrayinSliceOf = array;
      }

      return array;
    };
    return makeSlices;
  }]);
