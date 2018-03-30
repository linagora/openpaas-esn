(function(angular) {
  'use strict';

  angular
    .module('esn.attachments-selector')
    .controller('esnAttachmentsSelectorController', esnAttachmentsSelectorController);

  function esnAttachmentsSelectorController(
    $q,
    _
  ) {
    var self = this;

    self.onAttachmentsSelect = onAttachmentsSelect;
    self.getAttachmentsStatus = getAttachmentsStatus;

    //////////

    function getAttachmentsStatus() {
      var attachementTypeFilter = self.attachmentType ?
          { attachmentType: self.attachmentType } :
          undefined;
      var attachementFilter = self.attachmentFilter ?
          _.assign(self.attachmentFilter, attachementTypeFilter) :
          attachementTypeFilter;

      return {
        number: _.filter(self.attachments, attachementFilter).length,
        uploading: _.some(self.attachments, _.assign({ status: 'uploading' }, attachementFilter)),
        error: _.some(self.attachments, _.assign({ status: 'error' }, attachementFilter))
      };
    }

    function onAttachmentsSelect($files) {
      if (!$files || $files.length === 0) {
        return;
      }

      self.attachments = self.attachments || [];

      self.uploadAttachments({ $files: $files })
        .then(function(attachments) {
          self.attachments = attachments && _.union(self.attachments, attachments);
          self.onAttachmentsUpdate({ $attachments: self.attachments });
        });
    }
  }
})(angular);
