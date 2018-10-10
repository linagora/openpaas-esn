(function(angular) {
  'use strict';

  angular.module('esn.timeline').factory('esnTimelineEntriesHelper', esnTimelineEntriesHelper);

  function esnTimelineEntriesHelper($q, esnTimelineEntryProviders) {
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
      return $q.when(entries.map(denormalize).filter(Boolean));

      function denormalize(entry) {
        var providers = getProvidersForTimelineEntry(entry);

        if (!providers || !providers.length) {
          return;
        }

        entry.templateUrl = providers[0].templateUrl;

        return entry;
      }
    }
  }

})(angular);
