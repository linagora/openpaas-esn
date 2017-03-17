(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListGroupToggleSelectionController', function($scope, inboxSelectionService, _, INBOX_EVENTS) {
      var self = this;

      self.$onInit = $onInit;
      self.$onChanges = $onChanges;
      self.toggleSelection = toggleSelection;

      /////

      function $onInit() {
        $scope.$on(INBOX_EVENTS.ITEM_SELECTION_CHANGED, function() {
          var selectableElements = getSelectableElements();

          self.group.selected = selectableElements.length > 0 && _.all(selectableElements, { selected: true });
        });
      }

      function $onChanges(bindings) {
        if (bindings.elements) {
          self.hasSelectableItems = getSelectableElements().length > 0;
        }
      }

      function toggleSelection() {
        var selected = !self.group.selected;

        getSelectableElements().forEach(function(item) {
          inboxSelectionService.toggleItemSelection(item, selected);
        });
      }

      function getSelectableElements() {
        return _(self.elements).filter({ group: self.group }).filter({ selectable: true }).value();
      }
    });

})();
