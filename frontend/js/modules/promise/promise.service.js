(function() {
  'use strict';

  angular.module('esn.promise')
    .factory('esnPromiseService', esnPromiseService);

    function esnPromiseService($q, $timeout, ESN_PROMISE_RETRY_DEFAULT_OPTIONS) {
      return {
        retry: retry
      };

      /**
       * Wrap a promise returning function with a retry policy (using configurable exponential backoff)
       * @param {function} promiseFunc - operation/promise provider.
       * @param {Object} options - retry policy configuration :
       * - maxRetry: when to stop retrying operation
       * - interval: in milliseconds, initial interval to wait before retrying
       * - intervalMultiplier: factor applied on wait delay to get progressively longer intervals.
       */
      function retry(promiseFunc, options) {
        options = options ? angular.extend({}, ESN_PROMISE_RETRY_DEFAULT_OPTIONS, options) : ESN_PROMISE_RETRY_DEFAULT_OPTIONS;

        var resolver = function(remainingTry, interval) {
          var result = promiseFunc();

          if (remainingTry <= 1) {
            return result;
          }
          return result
            .catch(function() {
              return $timeout(angular.noop, interval).then(function() {
                return resolver(remainingTry - 1, interval * options.intervalMultiplier);
              });
            });
        };

        return resolver(options.maxRetry, options.interval);
      }
    }
})();
