'use strict';

angular
  .module('esn.attachment')
  .service('attachmentViewerService', attachmentViewerService);

  function attachmentViewerService(esnRegistry, $compile) {

    this.getFileUrl = function(fileId) {
      var fileUrl = '/api/files/' + fileId;
      return fileUrl;
    };

    this.renderPopup = function() {
      var template = '<div class="modal fade" id="myModal" role="dialog"> <div class="modal-dialog"> <!-- Modal content--> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal">&times;</button> <h4 class="modal-title">Modal Header</h4> </div> <div class="modal-body" id="esnAttachmentViewer"> <p>Some text in the modal.</p> </div> <div class="modal-footer"> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> </div> </div> </div> </div>';
      $('body').append(template);
    };

    this.openViewer = function(scope) {
      var template = angular.element('<esn-attachment-viewer></esn-attachment-viewer>');
      $('body').find('#esnAttachmentViewer').html($compile(template)(scope));
      $('#myModal').modal();
    };

    var registry = esnRegistry('file-viewer', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    this.getProvider = registry.get.bind(registry);
    this.getFileViewerProviders = registry.getAll.bind(registry);
    this.addFileViewerProvider = registry.add.bind(registry);

  }