(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListGroupToggleSelectionController', function($scope, inboxSelectionService, inboxFilteredList, _, INBOX_EVENTS) {
      var self = this,
          disableItemSelectionListener;

      self.$onInit = listenForItemSelectionChanges;
      self.toggleSelection = toggleSelection;
      self.hasSelectableItems = hasSelectableItems;

      /////

      function toggleSelection() {
        disableItemSelectionListener();

        self.selected = !self.selected;
        getSelectableElements().forEach(function(item) {
          inboxSelectionService.toggleItemSelection(item, self.selected);
        });

        listenForItemSelectionChanges();
      }

      function getSelectableElements() {
        return _.filter(inboxFilteredList.list(), { selectable: true });
      }

      function hasSelectableItems() {
        return _.some(inboxFilteredList.list(), { selectable: true });
      }

      function listenForItemSelectionChanges() {
        disableItemSelectionListener = $scope.$on(INBOX_EVENTS.ITEM_SELECTION_CHANGED, function() {
          self.selected = _.every(getSelectableElements(), { selected: true });
        });
      }
    });

})();
