(function(angular) {
  'use strict';

  angular.module('esn.file-browser')
    .component('fileBrowserFilterInput', {
      templateUrl: '/views/modules/file-browser/filter-input/file-browser-filter-input.html',
      bindings: {
        query: '='
      },
      controller: 'fileBrowserFilterInputController'
    });
})(angular);
