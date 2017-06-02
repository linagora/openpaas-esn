(function() {
  'use strict';

  angular
    .module('esn.header')
    .component('searchHeader', {
      templateUrl: '/views/modules/header/search/search-header.html',
      controller: 'ESNSearchHeaderController'
    });
})();
