(function() {
  'use strict';

  angular.module('esn.promise')
    .constant('ESN_PROMISE_RETRY_DEFAULT_OPTIONS', {
      maxRetry: 3,
      interval: 500,
      intervalMultiplier: 1.5
    });

})();
