(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListHeaderController', function($scope, inboxDateGroups, inboxFilteringService, INBOX_EVENTS) {
      var self = this;

      self.$onInit = initQuickFilter;
      self.$onChanges = $onChanges;
      self.setQuickFilter = setQuickFilter;

      $scope.$on(INBOX_EVENTS.FILTER_CHANGED, initQuickFilter);

      /////

      function initQuickFilter() {
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
