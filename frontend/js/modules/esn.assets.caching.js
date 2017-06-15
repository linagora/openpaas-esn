(function() {
  'use strict';

  angular
    .module('esn.assets.caching', [])
    .factory('assetsCachingAPI', assetsCachingAPI)
    .run(function($log, $window) {
      if ('serviceWorker' in $window.navigator) {
        navigator.serviceWorker.register('/frontend/js/modules/esn.assest.caching.worker.js', {scope: '/'})
          .then(function(registration) {
            $log.log('ServiceWorker registration success', registration);
          }).catch(function(error) {
            $log.error('ServiceWorker registration failed: ', error);
          });
      } else {
        $log.log('ServiceWorker not supported by: ', $window.navigator.userAgent);
      }
    });

  function assetsCachingAPI() {
    return {};// TODO
  }
})();
