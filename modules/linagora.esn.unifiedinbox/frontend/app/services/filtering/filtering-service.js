(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxFilteringService', function($rootScope, inboxMailboxesService, inboxFilters, _, INBOX_EVENTS) {
      var providerFilters = {}, quickFilter = null;

      return {
        getAvailableFilters: getAvailableFilters,
        isFilteringActive: isFilteringActive,
        clearFilters: clearFilters,
        setProviderFilters: setProviderFilters,
        getAllProviderFilters: getAllProviderFilters,
        getQuickFilter: getQuickFilter,
        setQuickFilter: setQuickFilter
      };

      /////

      function clearFilters() {
        inboxFilters.forEach(function(filter) {
          filter.checked = false;
        });

        setQuickFilter(null);
      }

      function getAvailableFilters() {
        return _.filter(inboxFilters, function(filter) {
          var available = providerFilters.types ? _.contains(providerFilters.types, filter.type) : filter.isGlobal;

          // When switching context, filters that become unavailble must be unchecked, to avoid side effects
          if (!available) {
            filter.checked = false;
          }

          return available;
        });
      }

      function isFilteringActive() {
        return _.some(inboxFilters, { checked: true }) || !!quickFilter;
      }

      function getAcceptedTypesFilter() {
        if (providerFilters.types) {
          return providerFilters.types;
        }

        return _anyFilterOrNull(_(inboxFilters).filter({ checked: true }).map('type').uniq().value());
      }

      function setProviderFilters(filters) {
        providerFilters = filters;
        quickFilter = null;

        $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
      }

      function getQuickFilter() {
        return quickFilter;
      }

      function setQuickFilter(filter) {
        quickFilter = filter;

        $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
      }

      function getAllFiltersByType() {
        return _(inboxFilters).groupBy('type').reduce(function(result, filters, type) {
          result[type] = _.reduce(filters, function(result, filter) {
            if (filter.checked) {
              result[filter.id] = true;
            }

            return result;
          }, {});

          return result;
        }, {});
      }

      function getAcceptedIdsFilter() {
        return _anyFilterOrNull(_(inboxFilters).filter({ checked: true, selectionById: true }).map('id').value());
      }

      function getAllProviderFilters() {
        return {
          acceptedIds: getAcceptedIdsFilter(),
          acceptedTypes: getAcceptedTypesFilter(),
          acceptedAccounts: providerFilters.accounts,
          filterByType: getAllFiltersByType(),
          context: providerFilters.context,
          quickFilter: quickFilter
        };
      }

      function _anyFilterOrNull(filters) {
        return filters.length > 0 ? filters : null;
      }
    });

})();
