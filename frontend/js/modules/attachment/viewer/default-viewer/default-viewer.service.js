'use strict';

angular
  .module('esn.attachment')
  .factory('attachmentDefaultViewerService', function() {
  	
    var defaultViewer = {
      name: 'defaultViewer',
      contentType: 'default',
      render: function(file) {
        return '<span>This is default ' + file.contentType + '</span>';
      }
    };

    return {
      defaultViewer: defaultViewer
    };
  });