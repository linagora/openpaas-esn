(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .config(function($provide, INFINITE_LIST_THROTTLE) {
      $provide.value('THROTTLE_MILLISECONDS', INFINITE_LIST_THROTTLE);
    });
})();
