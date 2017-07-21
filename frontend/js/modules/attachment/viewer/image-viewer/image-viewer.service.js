'use strict';

angular.module('esn.attachment')

  .factory('attachmentImageViewerService', function() {
    var imageViewer = {
      name: 'image',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
    };

    return {
      imageViewer: imageViewer
    };
  });
