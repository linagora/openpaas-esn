(function() {
  'use strict';

  angular.module('esn.search').factory('searchProviders', searchProviders);

  function searchProviders(Providers) {
    return new Providers();
  }

})();
