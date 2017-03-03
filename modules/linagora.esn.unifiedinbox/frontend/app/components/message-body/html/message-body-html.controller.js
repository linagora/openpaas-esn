(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxMessageBodyHtmlController', function($scope, $element, $timeout,
                                                           listenToPrefixedWindowMessage, loadImagesAsyncFilter, iFrameResize, _,
                                                           IFRAME_MESSAGE_PREFIXES) {
      var self = this,
          unregisterWindowListener;

      self.$onInit = $onInit;
      self.$onDestroy = $onDestroy;
      self.resize = resize;
      self.disableAutoScale = disableAutoScale;

      /////

      function $onInit() {
        unregisterWindowListener = listenToPrefixedWindowMessage(IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, function(cid) {
          $scope.$emit('wm:' + IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, cid);
        });

        $element.find('iframe').load(function(event) {
          $scope.$emit('iframe:loaded', event.target);
        });

        $scope.$on('iframe:loaded', function(event, iFrame) {
          var parent = angular.element($element).parent(),
              iFrameContent = loadImagesAsyncFilter(self.message.htmlBody, self.message.attachments),
              AUTO_SCALE_MESSAGE_HEIGHT = 40;

          iFrame.contentWindow.postMessage(IFRAME_MESSAGE_PREFIXES.CHANGE_DOCUMENT + iFrameContent, '*');

          self.iFrames = iFrameResize({
            checkOrigin: false,
            inPageLinks: true,
            heightCalculationMethod: 'max',
            sizeWidth: true,
            resizedCallback: function(data) {
              var ratio = self.autoScaleDisabled ? 1 : parent.width() / data.width;

              if (ratio < 1) {
                parent.css({
                  height: (Math.ceil(data.height * ratio) + AUTO_SCALE_MESSAGE_HEIGHT) + 'px',
                  overflow: 'hidden'
                });
                data.iframe.style.transform = 'scale3d(' + ratio + ', ' + ratio + ', 1)';
              } else {
                parent.css({
                  height: 'auto',
                  overflow: 'auto'
                });
                data.iframe.style.transform = '';
              }

              $scope.$apply(function() {
                self.message.scaled = ratio < 1;
              });
            }
          }, iFrame);
        });

        $scope.$on('email:collapse', function(event, isCollapsed) {
          if (!isCollapsed) {
            self.resize();
          }
        });

        $scope.$on('wm:' + IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, function(event, cid) {
          var attachment = _.find(self.message.attachments, { cid: cid });

          if (attachment) {
            attachment.getSignedDownloadUrl().then(function(url) {
              self.iFrames[0].contentWindow.postMessage(IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT + cid + ' ' + url, '*');
            });
          }
        });

        $scope.$on('$destroy', unregisterWindowListener);
      }

      function $onDestroy() {
        unregisterWindowListener();
      }

      function resize() {
        $timeout(function() {
          self.iFrames[0].iFrameResizer.resize();
        }, 0);
      }

      function disableAutoScale() {
        self.autoScaleDisabled = true;
        self.resize();
      }
    });

})();
