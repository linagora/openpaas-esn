(function(angular) {
  'use strict';

  angular.module('esn.timeline').controller('esnTimelineEntriesController', esnTimelineEntriesController);

  function esnTimelineEntriesController($scope, $log, _, esnTimelineEntriesHelper, infiniteScrollHelperBuilder, PageAggregatorService, TimelinePaginationProvider, session, TIMELINE_PAGE_SIZE) {
    var aggregator;

    $scope.timelineEntries = [];
    $scope.user = session.user;

    function updateScope(elements) {
      esnTimelineEntriesHelper.denormalizeAPIResponse(elements).then(function(denormalized) {
        Array.prototype.push.apply($scope.timelineEntries, denormalized);
      });
    }

    function load() {
      return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
    }

    function loadNextItems() {
      if (aggregator) {
        return load();
      }

      var provider = new TimelinePaginationProvider();

      aggregator = new PageAggregatorService('timelineControllerAggregator', [provider], {
        compare: function(a, b) { return b.published - a.published; },
        results_per_page: TIMELINE_PAGE_SIZE
      });

      return load();
    }

    $scope.loadNext = infiniteScrollHelperBuilder($scope, loadNextItems, updateScope, TIMELINE_PAGE_SIZE);
  }
})(angular);
