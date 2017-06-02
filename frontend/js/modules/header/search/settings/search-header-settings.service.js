(function() {
  'use strict';

  angular.module('esn.header')
    .factory('searchProviders', searchProviders);

  function searchProviders(Providers) {
    return new Providers();
  }

})();
