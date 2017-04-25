(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .filter('inboxItemDate', function(dateFilter, inboxDateGroups) {
      return function(date) {
        return dateFilter(date, inboxDateGroups.getGroup(date).dateFormat);
      };
    });

})();
