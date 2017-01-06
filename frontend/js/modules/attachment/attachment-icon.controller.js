(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentIconController', ESNAttachmentIconController);

  function ESNAttachmentIconController(contentTypeService, ESN_ATTACHMENT_ICONS) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.iconClass = ESN_ATTACHMENT_ICONS[contentTypeService.getType(self.type)] || ESN_ATTACHMENT_ICONS.default;
    }
  }
})();
