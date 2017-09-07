(function(angular) {
  'use strict';

  angular.module('esn.i18n')
    .factory('esnI18nLoader', esnI18nLoader);

    function esnI18nLoader($http, $q) {
      var getCatalogsPromise;

      return function(options) {
        if (!getCatalogsPromise) {
          getCatalogsPromise = getCatalogs();
        }

        return getCatalogsPromise
          .then(function(catalogs) {
            if (!catalogs[options.key]) {
              return $q.reject(Error('No catalog found for ' + options.key));
            }

            return catalogs[options.key];
          });
      };

      function getCatalogs() {
        return $http.get('/api/i18n').then(function(res) {
          return res.data;
        });
      }
    }
})(angular);
