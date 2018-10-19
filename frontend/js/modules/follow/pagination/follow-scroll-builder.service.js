(function(angular) {
  'use strict';

  angular.module('esn.follow').factory('FollowScrollBuilder', FollowScrollBuilder);

  function FollowScrollBuilder(infiniteScrollHelperBuilder, PageAggregatorService, _, FOLLOW_PAGE_SIZE) {
    return {
      build: build
    };

    function build($scope, name, provider, updateScope) {
      var aggregator;

      function loadNextItems() {
        aggregator = aggregator || new PageAggregatorService(name, [provider], {
          compare: function(a, b) {
            return b.link.timestamps.creation - a.link.timestamps.creation;
          },
          results_per_page: FOLLOW_PAGE_SIZE
        });

        return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
      }

      return infiniteScrollHelperBuilder($scope, loadNextItems, updateScope, FOLLOW_PAGE_SIZE);
    }
  }
})(angular);
