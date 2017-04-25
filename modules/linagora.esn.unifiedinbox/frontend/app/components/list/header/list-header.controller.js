(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListHeaderController', function(inboxDateGroups) {
      var self = this;

      self.$onChanges = $onChanges;

      /////

      function $onChanges(bindings) {
        if (!bindings.item || !bindings.item.currentValue) {
          return;
        }

        self.group = inboxDateGroups.getGroup(bindings.item.currentValue.date);
      }
    });

})();
