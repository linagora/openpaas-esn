(function() {
  'use strict';

  angular.module('esn.attachment-list')
    .component('esnAttachmentListItem', esnAttachmentListItem());

    function esnAttachmentListItem() {
      return {
        templateUrl: '/views/modules/attachment/list/item/attachment-list-item.html',
        controllerAs: 'ctrl',
        bindings: {
          attachment: '<'
        }
      };
    }
})();
