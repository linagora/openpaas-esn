'use strict';

angular.
module('esn.attachment').
factory('attachmentViewer', ['$compile', function($compile) {
  var getFileUrl = function(fileId) {
    var fileUrl = '/api/files/' + fileId;
    return fileUrl;
  };

  // var getWidthImage = function(fileId, callback) {
  //   var imageUrl = getFileUrl(fileId);
  //   var image = new Image();
  //   image.src = imageUrl;
  //   image.onload = function() {
  //     var imgWidth = image.width;
  //     callback(imgWidth);
  //   };
  // }

  var getFileType = function(contentType) {
    if (contentType.indexOf('video') !== -1) {
      return 'video';
    } else if (contentType.indexOf('image') !== -1) {
      return 'image';
    } else {
      return 'other';
    }
  }
  var getViewer = function(mainContent, scope, currentTarget) {
    console.log(scope);
    console.log(mainContent);
    var fileType = getFileType(scope.file.contentType);
    console.log(fileType);
    switch (fileType) {
      case 'image':
        var elem = angular.element('<img alt="" esn-image-viewer src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" class="lb-image">');
        // var template = angular.element(elem);
        break;
      case 'video':
        var elem = angular.element('<esn-video-viewer></esn-video-viewer>');
        break;
    }
    var template = angular.element(elem);
    mainContent.prepend($compile(template)(scope));
    template.scope().file = scope.file;
    template.scope().currentTarget = currentTarget;
  };

  var buildLightboxImage = function(currentTarget, element) {
    lightbox.option({
      'resizeDuration': 200,
      'wrapAround': true
    });

    // if there is a currentTarget, that means this is switched from other kinds of file viewer mode
    // then build meta again to find the new image element
    if (currentTarget) {
      //lightbox.buildMeta("image", element);
      lightbox.start(currentTarget);
    }
    // in other case, this is the first build ever
    else {
      lightbox.buildMain("image");
      lightbox.buildMeta("image", element);
    }
  };

  var buildLightboxVideo = function(currentTarget, video) {
    lightbox.option({
      'resizeDuration': 200,
      'wrapAround': true
    });

    if (currentTarget) {
      lightbox.buildMeta("video", video);
      //lightbox.startVideo(currentTarget);
    } else {
      lightbox.buildMain("video");
      lightbox.buildMeta("video");
    }
  };
  return {
    getFileUrl: getFileUrl,
    // getWidthImage: getWidthImage,
    getFileType: getFileType,
    getViewer: getViewer,
    buildLightboxImage: buildLightboxImage,
    buildLightboxVideo: buildLightboxVideo
  };
}]);