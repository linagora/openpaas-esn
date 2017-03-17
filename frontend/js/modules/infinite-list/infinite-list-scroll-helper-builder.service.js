(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .factory('infiniteScrollHelperBuilder', infiniteScrollHelperBuilder);

    function infiniteScrollHelperBuilder($q, $timeout, infiniteListService, INFINITE_LIST_THROTTLE, ELEMENTS_PER_PAGE) {
      return function(scope, loadNextItems, updateScope, elements_per_page) {
        elements_per_page = elements_per_page || ELEMENTS_PER_PAGE;

        return function() {
          if (scope.infiniteScrollDisabled || scope.infiniteScrollCompleted) {
            return $q.reject();
          }

          scope.infiniteScrollDisabled = true;

          return loadNextItems()
            .then(function(elements) {
              if (!elements || !elements.length) {
                scope.infiniteScrollCompleted = true;

                return $q.when([]);
              }

              updateScope(elements);

              elements = elements || [];
              if (elements.length < elements_per_page) {
                scope.infiniteScrollCompleted = true;
              }

              return elements;
            }, function(err) {
              scope.infiniteScrollCompleted = true;

              return $q.reject(err);
            })
            .then(function(result) {
              $timeout(function() {
                infiniteListService.loadMoreElements();
              }, INFINITE_LIST_THROTTLE, false);

              return result;
            })
            .finally(function() {
              scope.infiniteScrollDisabled = false;
            });
        };
      };
    }
})();
