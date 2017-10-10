(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService() {
    var currentItem = {};
    var viewer = null;

    return {
      open: open,
      registerViewer: registerViewer,
      setCurrentItem: setCurrentItem
    };

    function setCurrentItem(files, order) {
      currentItem.files = files;
      currentItem.order = order;
    }

    function registerViewer(_viewer) {
      viewer = _viewer;
      viewer.open(currentItem.files, currentItem.order);
    }
  }
})();
