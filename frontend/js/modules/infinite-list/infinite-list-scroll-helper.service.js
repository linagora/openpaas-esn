(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .factory('infiniteScrollHelper', infiniteScrollHelper);

  function infiniteScrollHelper(infiniteScrollHelperBuilder) {
    return function(scope, loadNextItems) {

      scope.elements = scope.elements || [];

      return infiniteScrollHelperBuilder(scope, loadNextItems, function(newElements) {
        newElements.forEach(function(element) {
          scope.elements.push(element);
        });
      });
    };
  }
})();
