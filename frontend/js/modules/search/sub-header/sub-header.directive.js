(function(angular) {
  'use strict';

  angular.module('esn.search').directive('esnSearchSubHeader', esnSearchSubHeader);

  function esnSearchSubHeader() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/search/sub-header/sub-header.html'
    };
}

})(angular);
