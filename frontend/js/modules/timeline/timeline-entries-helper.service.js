(function(angular) {
  'use strict';

  angular.module('esn.timeline').factory('esnTimelineEntriesHelper', esnTimelineEntriesHelper);

  function esnTimelineEntriesHelper($q, esnTimelineEntryProviders, DEFAULT_TIMELINE_ELEMENT) {
    return {
      getProvidersForTimelineEntry: getProvidersForTimelineEntry,
      denormalizeAPIResponse: denormalizeAPIResponse
    };

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
  }

})(angular);
