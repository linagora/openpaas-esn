'use strict';

var searchForm = angular.module('esn.search', []);
searchForm.directive('searchForm', function() {
    return {
      restrict: 'E',
      scope: {
      	searchSpinnerKey: '='
      },
      templateUrl: '/views/search/partials/searchForm.html'
    };
});