(function() {
  'use strict';

  angular
    .module('esn.search')
    .component('esnSearchHeader', {
      templateUrl: '/views/modules/search/header/search-header.html',
      controller: 'ESNSearchHeaderController'
    });
})();
