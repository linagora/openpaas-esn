(function() {
  'use strict';

  angular
    .module('esn.search')
    .component('searchHeader', {
      templateUrl: '/views/modules/search/header/search-header.html',
      controller: 'ESNSearchHeaderController'
    });
})();
