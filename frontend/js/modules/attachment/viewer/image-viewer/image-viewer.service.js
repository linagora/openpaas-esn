'use strict';

angular.module('esn.attachment')

  .factory('esnAttachmentImageViewerService', function() {
    var imageViewer = {
      name: 'image',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif'],
      fitSizeContent: function($image, fittingSize, resizeContainer) {
      	var img = new Image();
      	img.onload = function() {
      		var size = fittingSize(img.width, img.height);
      		$image.width(size.width);
          $image.height(size.height);
      		resizeContainer(size.width, size.height);
      	}
      	img.src = $image.src;
      }
    };

    return {
      imageViewer: imageViewer
    };
  });
