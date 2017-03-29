(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxFilteredList', function($rootScope, $q, ByDateElementGroupingTool, infiniteListService, inboxFilteringService, _,
                                           INBOX_EVENTS, VIRTUAL_SCROLL_DISTANCE) {
      var model = new ByDateElementGroupingTool(),
          renderedList = [];

      $rootScope.$on(INBOX_EVENTS.FILTER_CHANGED, _buildRenderedList);
      $rootScope.$on(INBOX_EVENTS.ITEM_FLAG_CHANGED, _buildRenderedList);
      $rootScope.$on(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, _buildRenderedList);

      return {
        list: list,
        addAll: addAll,
        asMdVirtualRepeatModel: asMdVirtualRepeatModel,
        getOldestProviderItem: getOldestProviderItem
      };

      /////

      function list() {
        return renderedList;
      }

      function addAll(items) {
        model.addAll(items);

        _buildRenderedList();
      }

      function asMdVirtualRepeatModel(load) {
        return {
          getItemAtIndex: function(index) {
            if (index > renderedList.length - VIRTUAL_SCROLL_DISTANCE) {
              load();
            }

            return renderedList[index];
          },
          getLength: function() {
            return renderedList.length;
          }
        };
      }

      function getOldestProviderItem(provider) {
        return _.findLast(renderedList, { provider: provider });
      }

      function _buildRenderedList() {
        var items = model.getGroupedElements();

        renderedList.length = 0;
        _.forEach(model.groups, function(group) {
          group.visibleItems = 0;
        });

        $q.all(items.map(_isItemFiltered.bind(null, inboxFilteringService.getAllProviderFilters())))
          .then(function(filteredStates) {
            _.forEach(filteredStates, function(filtered, index) {
              if (!filtered) {
                var item = items[index],
                    renderedItemIndex = renderedList.length;

                renderedList.push(item);

                item.group.visibleItems = (item.group.visibleItems || 0) + 1;

                item.previous = _renderedItemGetter(renderedItemIndex - 1);
                item.next = _renderedItemGetter(renderedItemIndex + 1);
              }
            });

            // First item has no "previous", last item has no "next"
            // This will needs to be improved as "next" of last item could trigger the load of more items, to actually find the next item
            if (renderedList.length > 0) {
              renderedList[0].previous = renderedList[renderedList.length - 1].next = null;
            }
          });
      }

      function _isItemFiltered(filters, item) {
        var provider = item.provider;

        return _providerAttributeIsCompatible(provider.types, filters.acceptedTypes)
          .then(function() {
            return _providerAttributeIsCompatible([provider.account], filters.acceptedAccounts);
          })
          .then(function() {
            return provider.itemMatches(item, filters);
          })
          .then(_.constant(false), _.constant(true));
      }

      function _providerAttributeIsCompatible(attribute, toMatch) {
        return $q(function(resolve, reject) {
          if (!toMatch) {
            return resolve();
          }

          _.some(attribute, function(value) {
            return _.contains(toMatch, value);
          }) ? resolve() : reject();
        });
      }

      function _renderedItemGetter(index) {
        return function() {
          return renderedList[index];
        };
      }
    });

})();
