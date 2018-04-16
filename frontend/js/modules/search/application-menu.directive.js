(function(angular) {
  'use strict';

  angular.module('esn.search').directive('applicationMenuSearch', applicationMenuSearch);

  function applicationMenuSearch(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/search', { name: 'search' }, 'Search')
    };
  }
})(angular);
