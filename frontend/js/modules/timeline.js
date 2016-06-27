'use strict';

angular.module('esn.timeline', [
  'op.dynamicDirective',
  'esn.http',
  'esn.infinite-list',
  'esn.provider',
  'esn.aggregator',
  'openpaas-logo'])

  .constant('DEFAULT_TIMELINE_ELEMENT', '/views/modules/timeline/default-timeline-element.html')

  .constant('TIMELINE_PAGE_SIZE', 10)

  .config(function(dynamicDirectiveServiceProvider) {
    var timelineControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(
      true, 'controlcenter-menu-timeline', { priority: -1 });
    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', timelineControlCenterMenu);
  })

  .directive('controlcenterMenuTimeline', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.timeline', 'mdi-timelapse', 'Timeline')
    };
  })

  .factory('esnTimelineAPI', function(esnRestangular) {

    function getUserTimelineEntries(options) {
      return esnRestangular.all('timelineentries').getList(options);
    }

    return {
      getUserTimelineEntries: getUserTimelineEntries
    };
  })

  .directive('esnTimelineEntryDisplayer', function() {
    return {
      restrict: 'E',
      scope: {
        entry: '='
      },
      templateUrl: '/views/modules/timeline/timeline-entry-displayer.html'
    };
  })

  .factory('esnTimelineEntryProviders', function() {

    var providers = {};

    function register(provider) {
      if (!provider || !provider.verb) {
        return;
      }

      if (!providers[provider.verb]) {
        providers[provider.verb] = [];
      }
      providers[provider.verb].push(provider);
    }

    function get(verb) {
      return providers[verb] || [];
    }

    return {
      get: get,
      register: register
    };
  })

  .factory('esnTimelineEntriesHelper', function($q, esnTimelineEntryProviders, DEFAULT_TIMELINE_ELEMENT) {

    function getProvidersForTimelineEntry(entry) {

      return esnTimelineEntryProviders.get(entry.verb).filter(function(provider) {
        if (angular.isFunction(provider.canHandle)) {
          return provider.canHandle(entry);
        }
        return true;
      });
    }

    function denormalizeAPIResponse(entries) {
      return $q.when(entries.map(function(entry) {
        var providers = getProvidersForTimelineEntry(entry);
        entry.templateUrl = providers.length ? providers[0].templateUrl : DEFAULT_TIMELINE_ELEMENT;
        return entry;
      }));

    }

    return {
      getProvidersForTimelineEntry: getProvidersForTimelineEntry,
      denormalizeAPIResponse: denormalizeAPIResponse
    };

  })

  .factory('TimelinePaginationProvider', function(esnTimelineAPI) {

    function TimelinePaginationProvider(options) {
      this.options = angular.extend({limit: 20, offset: 0}, {}, options);
    }

    TimelinePaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      return esnTimelineAPI.getUserTimelineEntries(self.options).then(function(response) {
        var result = {
          data: response.data,
          lastPage: (response.data.length < self.options.limit)
        };

        if (!result.lastPage) {
          self.options.offset += self.options.limit;
        }
        return result;
      });
    };
    return TimelinePaginationProvider;
  })

  .controller('esnTimelineEntriesController', function($scope, $log, _, esnTimelineEntriesHelper, infiniteScrollHelperBuilder, PageAggregatorService, TimelinePaginationProvider, session, TIMELINE_PAGE_SIZE) {

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
  });
