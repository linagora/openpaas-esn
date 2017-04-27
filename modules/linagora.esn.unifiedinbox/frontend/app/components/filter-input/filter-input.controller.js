(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxFilterInputController', function() {
      var self = this;

      self.clearFilter = clearFilter;

      /////

      function clearFilter() {
        self.onChange({ $filter: self.filter = '' });
      }
    });

})();
