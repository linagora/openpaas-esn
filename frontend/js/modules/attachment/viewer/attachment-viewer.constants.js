(function () {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_VIEWERS', {
      defaultViewer: {
        name: 'defaultViewer',
        directive: 'default',
        contentType: 'default',
        sizeOptions: {
          realSize: false,
          desiredRatio: {
            desiredRatioWindow: 0.27,
            desiredRatioSize: 2.9
          }
        }
      },
      imageViewer: {
        name: 'imageViewer',
        directive: 'image',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif'],
        sizeOptions: {
          realSize: true,
          desiredRatio: false
        }
      },
      videoViewer: {
        name: 'videoViewer',
        directive: 'video',
        contentType: ['video/mp4', 'video/webm', 'video/ogg'],
        sizeOptions: {
          realSize: false,
          desiredRatio: {
            desiredRatioWindow: 0.8,
            desiredRatioSize: 2
          }
        }
      }
    })
    .constant('ESN_AV_DEFAULT_OPTIONS', {
      initSize: {
        width: 250,
        height: 250
      },
      screenWidth: {
        more0: 0,
        more6: 600,
        more8: 800
      },
      minRatio: {
        more0: 0.8,
        more6: 0.5,
        more8: 0.3
      }
    })
    .constant('ESN_AV_VIEW_STATES', {
      OPEN_STATE: 'open',
      CLOSE_STATE: 'close'
    });

})();
