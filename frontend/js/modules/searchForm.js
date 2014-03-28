'use strict';

var searchForm = angular.module('esn.search', []);
searchForm.directive('searchForm', function() {
    return {
      restrict: 'E',
      scope: {
      	search: '=search'
      },
      templateUrl: '/views/search/partials/searchForm.html'
    };
});
