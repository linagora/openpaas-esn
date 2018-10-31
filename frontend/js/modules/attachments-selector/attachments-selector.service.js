(function(angular) {
  'use strict';

  angular
    .module('esn.attachments-selector')
    .service('esnAttachmentsSelectorService', esnAttachmentsSelectorService);

  function esnAttachmentsSelectorService($q, _) {
    return {
      newAttachmentServiceHolder: newAttachmentServiceHolder
    };

    function newAttachmentServiceHolder(opts) {
      function AttachmentServiceHolder(options) {
        ['attachments', 'onAttachmentsUpdate', 'uploadAttachments'].forEach(function(key) {
          if (!options.hasOwnProperty(key)) {
            throw new Error('AttachmentServiceHolder.constructor: ' + key + ' is mandatory');
          }
        });

        ['attachments', 'attachmentFilter', 'attachmentType', 'onAttachmentsUpdate', 'uploadAttachments']
          .forEach(function(key) {
            var descriptor = {
              get: function() {
                return options[key];
              },
              set: function(val) {
                options[key] = val;
              }
            };
            Object.defineProperty(this, key, descriptor);
          }.bind(this));

        AttachmentServiceHolder.prototype.constructor = AttachmentServiceHolder;
        AttachmentServiceHolder.prototype.getAttachmentsStatus = getAttachmentsStatus.bind(this);
        AttachmentServiceHolder.prototype.onAttachmentsSelect = onAttachmentsSelect.bind(this);
      }

      function getAttachmentsStatus() {
        var attachmentTypeFilter = this.attachmentType ? { attachmentType: this.attachmentType } : undefined;
        var attachmentFilter = this.attachmentFilter ?
          _.assign(this.attachmentFilter, attachmentTypeFilter) :
          attachmentTypeFilter;

        return {
          number: _.filter(this.attachments, attachmentFilter).length,
          uploading: _.some(this.attachments, _.assign({ status: 'uploading' }, attachmentFilter)),
          error: _.some(this.attachments, _.assign({ status: 'error' }, attachmentFilter))
        };
      }

      function onAttachmentsSelect(files) {
        if (!files || files.length === 0) {
          return;
        }

        this.uploadAttachments(files).then(function(attachments) {
          this.attachments = attachments && _.union(this.attachments, attachments);
          this.onAttachmentsUpdate(this.attachments);
        }.bind(this));
      }

      return new AttachmentServiceHolder(opts);
    }
  }
})(angular);
