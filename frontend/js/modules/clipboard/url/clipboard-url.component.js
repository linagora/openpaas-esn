(function(angular) {
  'use strict';

  angular.module('esn.clipboard')
    .component('esnClipboardUrl', {
      bindings: {
        url: '<'
      },
      templateUrl: '/views/modules/clipboard/url/clipboard-url.html',
      controller: 'esnClipboardUrlController',
      controllerAs: 'ctrl'
    });
})(angular);
