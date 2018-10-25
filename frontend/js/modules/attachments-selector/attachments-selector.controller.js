(function(angular) {
  'use strict';

  angular
    .module('esn.attachments-selector')
    .controller('esnAttachmentsSelectorController', esnAttachmentsSelectorController);

  function esnAttachmentsSelectorController(esnAttachmentsSelectorService) {
    var self = this;

    if (self.attachmentHolder === undefined) {
      self.attachmentHolder = esnAttachmentsSelectorService.newAttachmentServiceHolder({
        get attachments() {
          return self.attachments;
        },
        set attachments(values) {
          self.attachments = values;
        },
        get attachmentFilter() {
          return self.attachmentFilter;
        },
        set attachmentFilter(values) {
          self.attachmentFilter = values;
        },
        get attachmentType() {
          return self.attachmentType;
        },
        set attachmentType(values) {
          self.attachmentType = values;
        },
        onAttachmentsUpdate: function(attachments) {
          return self.onAttachmentsUpdate({ $attachments: attachments });
        },
        uploadAttachments: function(files) {
          return self.uploadAttachments({ $files: files });
        }
      });
    }
  }
})(angular);
