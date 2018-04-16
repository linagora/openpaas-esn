(function(angular) {
  'use strict';

  angular.module('esn.search').directive('searchSubHeader', searchSubHeader);

  function searchSubHeader() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/search/sub-header/sub-header.html'
    };
}

})(angular);
