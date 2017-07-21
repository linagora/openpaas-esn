'use strict';

// angular.
// module('esn.attachment').
// factory('attachmentViewer', ['$compile', function($compile) {
//   var getFileUrl = function(fileId) {
//     var fileUrl = '/api/files/' + fileId;
//     return fileUrl;
//   };

//   // var getWidthImage = function(fileId, callback) {
//   //   var imageUrl = getFileUrl(fileId);
//   //   var image = new Image();
//   //   image.src = imageUrl;
//   //   image.onload = function() {
//   //     var imgWidth = image.width;
//   //     callback(imgWidth);
//   //   };
//   // }

//   var getFileType = function(contentType) {
//     if (contentType.indexOf('video') !== -1) {
//       return 'video';
//     } else if (contentType.indexOf('image') !== -1) {
//       return 'image';
//     } else {
//       return 'other';
//     }
//   }
//   var getViewer = function(mainContent, scope, currentTarget) {
//     console.log(scope);
//     console.log(mainContent);
//     var fileType = getFileType(scope.file.contentType);
//     console.log(fileType);
//     switch (fileType) {
//       case 'image':
//         var elem = angular.element('<img alt="" esn-image-viewer src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" class="lb-image">');
//         // var template = angular.element(elem);
//         break;
//       case 'video':
//         var elem = angular.element('<esn-video-viewer></esn-video-viewer>');
//         break;
//     }
//     var template = angular.element(elem);
//     mainContent.prepend($compile(template)(scope));
//     template.scope().file = scope.file;
//     template.scope().currentTarget = currentTarget;
//   };

//   var buildLightboxImage = function(currentTarget, element) {
//     lightbox.option({
//       'resizeDuration': 200,
//       'wrapAround': true
//     });

//     // if there is a currentTarget, that means this is switched from other kinds of file viewer mode
//     // then build meta again to find the new image element
//     if (currentTarget) {
//       //lightbox.buildMeta("image", element);
//       lightbox.start(currentTarget);
//     }
//     // in other case, this is the first build ever
//     else {
//       lightbox.buildMain("image");
//       lightbox.buildMeta("image", element);
//     }
//   };

//   var buildLightboxVideo = function(currentTarget, video) {
//     lightbox.option({
//       'resizeDuration': 200,
//       'wrapAround': true
//     });

//     if (currentTarget) {
//       lightbox.buildMeta("video", video);
//       //lightbox.startVideo(currentTarget);
//     } else {
//       lightbox.buildMain("video");
//       lightbox.buildMeta("video");
//     }
//   };
//   return {
//     getFileUrl: getFileUrl,
//     // getWidthImage: getWidthImage,
//     getFileType: getFileType,
//     getViewer: getViewer,
//     buildLightboxImage: buildLightboxImage,
//     buildLightboxVideo: buildLightboxVideo
//   };
// }]);
//var imageViewer = {
//   type: 'image',
//   isSupported: function(data) {
//     if (data.contentType.indexOf('image') > -1) {
//       return true;
//     }
//   },
//   render: function(data) {
//     return '<img src="' + data.url + '" />';
//   }
// };

// this.defaultViewer = {
//   render: function(data) {
//     return '<span>this is default ' + data.contentType + '</span>';
//   }
// };

// this.availableViewers = [imageViewer];

// this.register = function(viewer) {
//   this.availableViewers.push(viewer);
//   return viewer;
// };

// this.getAllViewers = function() {
//   return this.availableViewers;
// };



// function isSupported(data) {
//   var contentType = data.contentType;
//   var fileType = getFileType(contentType);
//   var isSupported = false;
//   if (fileType === "other") {
//     return isSupported;
//   } else {
//     this.viewer.type.forEach(function(type) {
//       if (fileType == type) {
//         isSupported = true;
//       }
//     });
//     return isSupported;
//   }
// }

// var getFileType = function(contentType) {
//   var type = 'other';
//   if (contentType.indexOf('html') > -1) {
//     type = 'html';
//   } else if (contentType.indexOf('json') > -1) {
//     type = 'json';
//   } else if (contentType.indexOf('xml') > -1) {
//     type = 'xml';
//   } else if (contentType.indexOf('image') > -1) {
//     type = 'image';
//   } else if (contentType.indexOf('video') > -1) {
//     type = 'video';
//   }
//   return type;
// };
'use strict';

angular.
module('esn.attachment').
service('attachmentViewerService', attachmentViewerService).
provider('attachmentDefaultViewerProvider', attachmentDefaultViewerProvider);

function attachmentViewerService(esnRegistry, $compile) {

  this.getFileUrl = function(fileId) {
    var fileUrl = '/api/files/' + fileId;
    return fileUrl;
  };

  var registry = esnRegistry('file-viewer', {
    match: function(contentType, provider) {
      return provider.contentType.indexOf(contentType) > -1;
    }
  });

  this.getProvider = registry.get.bind(registry);
  this.getFileViewerProviders = registry.getAll.bind(registry);
  this.addFileViewerProvider = registry.add.bind(registry);

  this.renderPopup = function() {
    var template = '<div class="modal fade" id="myModal" role="dialog"> <div class="modal-dialog"> <!-- Modal content--> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal">&times;</button> <h4 class="modal-title">Modal Header</h4> </div> <div class="modal-body" id="esnAttachmentViewer"> <p>Some text in the modal.</p> </div> <div class="modal-footer"> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> </div> </div> </div> </div>';
    $('body').append(template);
  };

  this.openViewer = function(scope) {
    var template = angular.element('<esn-attachment-viewer></esn-attachment-viewer>');
    $('body').find('#esnAttachmentViewer').html($compile(template)(scope));
    $("#myModal").modal();
  };
};

function attachmentDefaultViewerProvider(_) {

  function DefaultViewer(name) {
    this.name = name;
    this.contentType = "default";
    this.render = function(file) {
      return '<span>This is default ' + file.contentType + '</span>';
    };
  };

  // DefaultViewer.prototype.render = function(file) {
  //   return '<span>This is default ' + file.contentType + '</span>';
  // };

  function getDefaultViewer() {
    return new DefaultViewer("defaultViewer");
  }

  return {
    getDefaultViewer: getDefaultViewer,
    $get: _.constant(getDefaultViewer)
  }
};