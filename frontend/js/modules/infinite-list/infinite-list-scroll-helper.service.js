(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .factory('infiniteScrollHelper', infiniteScrollHelper);

  function infiniteScrollHelper(infiniteScrollHelperBuilder) {
    return function(scope, loadNextItems, updateScope, elementsPerPage) {
      scope.elements = scope.elements || [];
      updateScope = updateScope || function(newElements) {
        newElements.forEach(function(element) {
          scope.elements.push(element);
        });
      };

      return infiniteScrollHelperBuilder(scope, loadNextItems, updateScope, elementsPerPage);
    };
  }
})();
