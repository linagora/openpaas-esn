(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .filter('inboxLinkItems', function(_) {
      return function(items) {
        _.forEach(items, function(item, i, items) {
          // We don't store the reference to next and previous items directly as properties of each item
          // because this would make Angular run into infinite loops during dirty checking...
          item.previous = i > 0 ? _.constant(items[i - 1]) : null;
          item.next = i < items.length - 1 ? _.constant(items[i + 1]) : null;
        });

        return items;
      };
    });

})();
