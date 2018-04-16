(function(angular) {
  'use strict';

  angular.module('esn.search').directive('searchForm', searchForm);

  function searchForm(defaultSpinnerConfiguration) {
    return {
      restrict: 'E',
      controller: function($scope) {
        $scope.spinnerKey = angular.isDefined($scope.spinnerKey) ? $scope.spinnerKey : defaultSpinnerConfiguration.spinnerKey;
        $scope.spinnerConf = angular.isDefined($scope.spinnerConf) ? $scope.spinnerConf : defaultSpinnerConfiguration.spinnerConf;
      },
      templateUrl: '/views/modules/search/form/search-form.html'
    };
  }
})(angular);
