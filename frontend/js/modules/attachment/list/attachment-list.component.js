(function() {
  'use strict';

  angular.module('esn.attachment-list')
    .component('esnAttachmentList', esnAttachmentList());

    function esnAttachmentList() {
      return {
        templateUrl: '/views/modules/attachment/list/attachment-list.html',
        controller: 'ESNAttachmentListController',
        controllerAs: 'ctrl',
        bindings: {
          objectType: '@',
          id: '@',
          elementsPerPage: '@?',
          scrollInsideContainer: '@?'
        }
      };
    }
})();
