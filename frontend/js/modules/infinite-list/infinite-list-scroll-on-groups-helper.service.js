(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .factory('infiniteScrollOnGroupsHelper', infiniteScrollOnGroupsHelper);

  function infiniteScrollOnGroupsHelper($timeout, infiniteScrollHelperBuilder, infiniteListService, INFINITE_LIST_EVENTS) {
    return function(scope, loadNextItems, elementGroupingTool) {
      var groups = elementGroupingTool;

      var unregisterAddElementListener = scope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
        scope.groups.addAll(elements);
      });
      var unregisterRemoveElementListener = scope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, function(event, elements) {
        scope.groups.removeElements(elements);

        $timeout(infiniteListService.loadMoreElements, 0);
      });

      var helper = infiniteScrollHelperBuilder(scope, loadNextItems, function(newElements) {
        groups.addAll(newElements);
      });

      helper.destroy = function() {
        unregisterAddElementListener();
        unregisterRemoveElementListener();

        scope.groups.reset();
      };

      scope.groups = groups;
      scope.groupedElements = groups.getGroupedElements();

      return helper;
    };
  }
})();
