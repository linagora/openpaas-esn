(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListHeaderController', function(inboxDateGroups) {
      var self = this;

      self.$onChanges = $onChanges;

      /////

      function $onChanges(bindings) {
        if (!bindings.item) {
          return;
        }

        self.group = bindings.item.currentValue && inboxDateGroups.getGroup(bindings.item.currentValue.date);
      }
    });

})();
