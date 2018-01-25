(function(angular) {
  'use strict';

  angular.module('esn.file-browser')
    .component('esnFileBrowser', {
      templateUrl: '/views/modules/file-browser/file-browser.html',
      bindings: {
        loadNode: '&',
        selectedNodes: '=',
        options: '<'
      },
      controller: 'esnFileBrowserController'
    });
})(angular);
