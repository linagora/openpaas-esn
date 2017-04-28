(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListHeaderController', function(inboxDateGroups, inboxFilteringService) {
      var self = this;

      self.$onInit = $onInit;
      self.$onChanges = $onChanges;
      self.setQuickFilter = setQuickFilter;

      /////

      function $onInit() {
        self.quickFilter = inboxFilteringService.getQuickFilter();
      }

      function $onChanges(bindings) {
        if (!bindings.item) {
          return;
        }

        self.group = bindings.item.currentValue && inboxDateGroups.getGroup(bindings.item.currentValue.date);
      }

      function setQuickFilter(filter) {
        inboxFilteringService.setQuickFilter(self.quickFilter = filter);
      }
    });

})();
